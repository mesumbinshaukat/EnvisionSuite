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

        // Ledger snapshot derived from journals, PKR-only display
        $ledgerAccounts = DB::table('accounts')->count();

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

        // Financial KPIs from journals (aligned with Ledger heuristics)
        $balances = $this->accountBalances($shopId);

        // Recent journal entries for dashboard widget
        $recentJournals = DB::table('bk_journal_entries')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderByDesc('date')
            ->limit(10)
            ->get(['id','date','memo']);

        // Current month net profit using same approach as ProfitLoss
        [$revenueMonth, $expenseMonth, $cogsMonth] = $this->currentMonthPnL($shopId);
        $netProfitMonth = $revenueMonth - ($expenseMonth + $cogsMonth);

        // Compute a meaningful PKR ledger total: working capital = cash + bank + receivables - payables
        $ledgerBalances = collect([
            ['currency' => 'PKR', 'total' => ($balances['cashInHand'] + $balances['bankBalance'] + $balances['receivables'] - $balances['payables'])]
        ]);

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
            'recentJournals' => $recentJournals,
            'ledgerBalances' => $ledgerBalances,
        ]);
    }

    protected function accountBalances(?int $shopId): array
    {
        // Base query across journal lines joined to entries & accounts
        $base = DB::table('journal_lines')
            ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
            ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId));

        // Use same heuristic as LedgerController: compute net by account normal side without clamping
        $sumFor = function($query, array $nameLike, array $typeIn) {
            $q = (clone $query)
                ->where(function($qq) use ($nameLike) {
                    foreach ($nameLike as $pat) {
                        $qq->orWhere('accounts.name','like',$pat);
                    }
                })
                ->whereIn(DB::raw('LOWER(accounts.type)'), $typeIn);
            $row = $q->selectRaw(
                "SUM(CASE WHEN LOWER(accounts.type) IN ('asset','assets','expense','expenses') THEN COALESCE(journal_lines.debit,0) - COALESCE(journal_lines.credit,0) ELSE 0 END) as dsum, " .
                "SUM(CASE WHEN LOWER(accounts.type) IN ('liability','liabilities','equity','equities','revenue','revenues','income','incomes') THEN COALESCE(journal_lines.credit,0) - COALESCE(journal_lines.debit,0) ELSE 0 END) as csum"
            )->first();
            $assetSide = (float) ($row->dsum ?? 0);
            $liabSide = (float) ($row->csum ?? 0);
            return round($assetSide + $liabSide, 2);
        };

        $cashInHand = $sumFor($base, ['%cash%','%petty%','%till%'], ['asset','assets']);
        $bankBalance = $sumFor($base, ['%bank%','%checking%','%current account%'], ['asset','assets']);
        $receivables = $sumFor($base, ['%receivable%','%customer%','%debtors%'], ['asset','assets']);
        $payables = $sumFor($base, ['%payable%','%supplier%','%vendor%','%credit card%'], ['liability','liabilities']);

        return [
            'cashInHand' => $cashInHand,
            'bankBalance' => $bankBalance,
            'receivables' => $receivables,
            'payables' => $payables,
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
