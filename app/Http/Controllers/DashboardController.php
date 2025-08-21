<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Models\Shop;
use App\Models\JournalLine;
use App\Models\SaleItem;
use App\Models\Purchase;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        $salesQuery = Sale::query();
        if ($shopId) { $salesQuery->where('shop_id', $shopId); }
        if (!$isSuper) { $salesQuery->where('user_id', $user?->id); }

        $salesToday = (clone $salesQuery)->whereDate('created_at', $today)->sum('total');
        $salesMonth = (clone $salesQuery)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total');
        $ordersCount = (clone $salesQuery)->count();

        $productsQuery = Product::query();
        if ($shopId) { $productsQuery->where('shop_id', $shopId); }
        $productsCount = $productsQuery->count();
        $lowStock = (clone $productsQuery)->whereNotNull('stock')->where('stock', '<', 5)->orderBy('stock')->take(5)->get(['id','name','sku','stock']);

        // Ledger snapshot (safe fallbacks if tables empty)
        $ledgerAccounts = DB::table('ledger_accounts')->count();
        $ledgerBalances = DB::table('ledger_balances')
            ->select('currency', DB::raw('SUM(CAST(balance as decimal(24,8))) as total'))
            ->groupBy('currency')
            ->get();

        // Pricing aggregates from sale items
        $itemsQuery = \App\Models\SaleItem::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->whereHas('sale', function($q) use ($user, $isSuper) {
                $q->when(!$isSuper, fn($qq) => $qq->where('user_id', $user?->id));
            });
        $totalQty = (int) (clone $itemsQuery)->sum('quantity');
        $weightedSum = (float) (clone $itemsQuery)->selectRaw('SUM(quantity * COALESCE(sold_unit_price, unit_price)) as s')->value('s') ?? 0.0;
        $avgSoldPrice = $totalQty > 0 ? round($weightedSum / $totalQty, 2) : 0.0;
        $originalUnits = (int) (clone $itemsQuery)->where(function($q){
            $q->where('is_discounted', false)->orWhereNull('is_discounted');
        })->sum('quantity');
        $discountedUnits = (int) (clone $itemsQuery)->where('is_discounted', true)->sum('quantity');

        // Lent-out inventory total
        $lentOutTotal = (int) \App\Models\InventoryLoan::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->selectRaw('SUM(GREATEST(quantity - returned_quantity, 0)) as lent')
            ->value('lent');

        // Financial KPIs from journals
        $balances = $this->accountBalances($shopId);

        // Current month net profit using same approach as ProfitLoss
        [$revenueMonth, $expenseMonth, $cogsMonth] = $this->currentMonthPnL($shopId);
        $netProfitMonth = $revenueMonth - ($expenseMonth + $cogsMonth);

        return Inertia::render('Dashboard', [
            'kpis' => [
                'salesToday' => (float) $salesToday,
                'salesMonth' => (float) $salesMonth,
                'ordersCount' => $ordersCount,
                'productsCount' => $productsCount,
                'ledgerAccounts' => $ledgerAccounts,
                'avgSoldPrice' => $avgSoldPrice,
                'unitsOriginal' => $originalUnits,
                'unitsDiscounted' => $discountedUnits,
                'lentOutTotal' => (int) ($lentOutTotal ?? 0),
                'cashInHand' => $balances['cashInHand'],
                'bankBalance' => $balances['bankBalance'],
                'receivables' => $balances['receivables'],
                'payables' => $balances['payables'],
                'netProfitMonth' => round($netProfitMonth, 2),
            ],
            'lowStock' => $lowStock,
            'ledgerBalances' => $ledgerBalances,
        ]);
    }

    protected function accountBalances(?int $shopId): array
    {
        // Helper to compute net balance for a set of account codes by type behavior
        $sumFor = function(array $codes, string $normal) use ($shopId) {
            $rows = JournalLine::select(DB::raw('SUM(journal_lines.debit) as d'), DB::raw('SUM(journal_lines.credit) as c'))
                ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
                ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
                ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
                ->whereIn('accounts.code', $codes)
                ->first();
            $d = (float) ($rows->d ?? 0); $c = (float) ($rows->c ?? 0);
            if ($normal === 'debit') { return max($d - $c, 0); }
            return max($c - $d, 0);
        };

        $cashInHand = $sumFor(['1000'], 'debit');
        $bankBalance = $sumFor(['1010','1020'], 'debit');
        $receivables = $sumFor(['1100','1110'], 'debit');
        $payables = $sumFor(['2100','2110'], 'credit');

        return [
            'cashInHand' => round($cashInHand, 2),
            'bankBalance' => round($bankBalance, 2),
            'receivables' => round($receivables, 2),
            'payables' => round($payables, 2),
        ];
    }

    protected function currentMonthPnL(?int $shopId): array
    {
        $from = now()->startOfMonth()->toDateString();
        $to = now()->toDateString();

        // Revenue & Expense from journal lines over the period
        $sums = JournalLine::select('accounts.type', DB::raw('SUM(journal_lines.debit) as d'), DB::raw('SUM(journal_lines.credit) as c'))
            ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
            ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
            ->whereBetween('bk_journal_entries.date', [$from, $to])
            ->groupBy('accounts.type')
            ->get();
        $revenue = 0.0; $expense = 0.0;
        foreach ($sums as $row) {
            if ($row->type === 'revenue') { $revenue += (float) $row->c - (float) $row->d; }
            if ($row->type === 'expense') { $expense += (float) $row->d - (float) $row->c; }
        }

        // COGS computed similar to ProfitLoss
        $avgCosts = [];
        $productQtys = [];
        $productCosts = [];
        $purchases = Purchase::with('items')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->where('created_at', '<=', $to)
            ->get();
        foreach ($purchases as $purchase) {
            $totalUnits = (int) $purchase->items->sum('quantity');
            $extra = (float) ($purchase->tax_total ?? 0) + (float) ($purchase->other_charges ?? 0);
            $extraPerUnit = $totalUnits > 0 ? ($extra / $totalUnits) : 0.0;
            foreach ($purchase->items as $it) {
                $pid = $it->product_id;
                $q = (int) $it->quantity;
                $unitCost = (float) $it->unit_cost + $extraPerUnit;
                $productQtys[$pid] = ($productQtys[$pid] ?? 0) + $q;
                $productCosts[$pid] = ($productCosts[$pid] ?? 0.0) + ($q * $unitCost);
            }
        }
        foreach ($productQtys as $pid => $qty) {
            $cost = (float) ($productCosts[$pid] ?? 0.0);
            $avgCosts[$pid] = $qty > 0 ? ($cost / $qty) : 0.0;
        }
        $salesInPeriod = SaleItem::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('product_id, SUM(quantity) as qty')
            ->groupBy('product_id')
            ->get();
        $cogs = 0.0;
        foreach ($salesInPeriod as $row) {
            $avg = (float) ($avgCosts[$row->product_id] ?? 0.0);
            $cogs += $avg * (int) $row->qty;
        }

        return [ (float) $revenue, (float) $expense, round($cogs, 2) ];
    }
}
