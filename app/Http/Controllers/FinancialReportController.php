<?php

namespace App\Http\Controllers;

use App\Exports\JournalsExport;
use App\Exports\TrialBalanceExport;
use App\Exports\ProfitLossExport;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use App\Models\Shop;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class FinancialReportController extends Controller
{
    public function journals(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id');
        if (!$shopId && Schema::hasTable('shops')) {
            $shopId = optional(Shop::first())->id;
        }

        $entries = JournalEntry::with(['lines.account'])
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Reports/Journals', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'entries' => $entries,
        ]);
    }

    public function journalsExport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $shopId = session('shop_id');
        if (!$shopId && Schema::hasTable('shops')) {
            $shopId = optional(Shop::first())->id;
        }
        return Excel::download(new JournalsExport($from, $to, $shopId), 'journals.xlsx');
    }

    public function trialBalance(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $shopId = session('shop_id');
        if (!$shopId && Schema::hasTable('shops')) {
            $shopId = optional(Shop::first())->id;
        }

        $balances = $this->trialBalanceData($from, $to, $shopId);

        return Inertia::render('Reports/TrialBalance', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'rows' => $balances['rows'],
            'totals' => $balances['totals'],
        ]);
    }

    public function trialBalanceExport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $shopId = session('shop_id');
        if (!$shopId && Schema::hasTable('shops')) {
            $shopId = optional(Shop::first())->id;
        }
        return Excel::download(new TrialBalanceExport($from, $to, $shopId), 'trial_balance.xlsx');
    }

    public function profitLoss(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $shopId = session('shop_id');
        if (!$shopId && Schema::hasTable('shops')) {
            $shopId = optional(Shop::first())->id;
        }

        $tb = $this->trialBalanceData($from, $to, $shopId);
        $revenue = collect($tb['rows'])->where('type','revenue')->sum('credit');
        $expense = collect($tb['rows'])->where('type','expense')->sum('debit');

        // Compute COGS from purchases (avg cost up to period end) applied to sales in period
        $avgCosts = PurchaseItem::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->where('created_at', '<=', $to)
            ->selectRaw('product_id, SUM(quantity) as qty, SUM(quantity * unit_cost) as cost')
            ->groupBy('product_id')
            ->get()
            ->mapWithKeys(function ($row) {
                $qty = (int) $row->qty;
                $cost = (float) $row->cost;
                $avg = $qty > 0 ? ($cost / $qty) : 0.0;
                return [$row->product_id => $avg];
            });

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
        $cogs = round($cogs, 2);

        $profit = $revenue - ($expense + $cogs);

        return Inertia::render('Reports/ProfitLoss', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'revenue' => $revenue,
            'expense' => $expense + $cogs,
            'profit' => $profit,
            'rows' => [
                'revenue' => collect($tb['rows'])->where('type','revenue')->values(),
                'expense' => collect($tb['rows'])->where('type','expense')->values()->push([
                    'code' => 'COGS',
                    'name' => 'Cost of Goods Sold (computed)',
                    'type' => 'expense',
                    'debit' => $cogs,
                    'credit' => 0,
                ]),
            ],
            'cogs' => $cogs,
        ]);
    }

    public function profitLossExport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $shopId = session('shop_id');
        if (!$shopId && Schema::hasTable('shops')) {
            $shopId = optional(Shop::first())->id;
        }
        return Excel::download(new ProfitLossExport($from, $to, $shopId), 'profit_loss.xlsx');
    }

    protected function trialBalanceData(string $from, string $to, ?int $shopId): array
    {
        $lines = JournalLine::select('accounts.id as account_id','accounts.code','accounts.name','accounts.type',
                DB::raw('SUM(journal_lines.debit) as debit_sum'),
                DB::raw('SUM(journal_lines.credit) as credit_sum'))
            ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
            ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
            ->whereBetween('bk_journal_entries.date', [$from, $to])
            ->groupBy('accounts.id','accounts.code','accounts.name','accounts.type')
            ->orderBy('accounts.code')
            ->get();

        $rows = [];
        $totDebit = 0; $totCredit = 0;
        foreach ($lines as $l) {
            // Normal balances: assets/expenses debit; liabilities/equity/revenue credit
            $debit = (float) $l->debit_sum;
            $credit = (float) $l->credit_sum;
            $balanceDebit = 0; $balanceCredit = 0;
            if (in_array($l->type, ['asset','expense'])) {
                $net = $debit - $credit; // normal debit
                if ($net >= 0) { $balanceDebit = $net; } else { $balanceCredit = abs($net); }
            } else {
                $net = $credit - $debit; // normal credit
                if ($net >= 0) { $balanceCredit = $net; } else { $balanceDebit = abs($net); }
            }
            $rows[] = [
                'code' => $l->code,
                'name' => $l->name,
                'type' => $l->type,
                'debit' => round($balanceDebit, 2),
                'credit' => round($balanceCredit, 2),
            ];
            $totDebit += $balanceDebit; $totCredit += $balanceCredit;
        }

        return [
            'rows' => $rows,
            'totals' => ['debit' => round($totDebit,2), 'credit' => round($totCredit,2)],
        ];
    }
}
