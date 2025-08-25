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

        $scope = $request->input('scope', 'revenue'); // all | assets | liabilities | revenue | expense | account:CODE

        // Determine entry IDs for scoped views so we include all lines on entries that match the scope
        $entryIds = null;
        if ($scope !== 'all') {
            $map = [
                'assets' => ['asset','assets'],
                'liabilities' => ['liability','liabilities'],
                'revenue' => ['revenue','revenues','income','incomes'],
                'expense' => ['expense','expenses'],
            ];
            $entryIdQuery = DB::table('journal_lines')
                ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
                ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
                ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
                ->whereBetween('bk_journal_entries.date', [$from, $to])
                ->distinct()
                ->select('bk_journal_entries.id');
            if (str_starts_with($scope, 'account:')) {
                $code = explode(':', $scope, 2)[1] ?? '';
                if ($code !== '') { $entryIdQuery->where('accounts.code', $code); }
            } elseif (isset($map[$scope])) {
                $entryIdQuery->whereIn(DB::raw('LOWER(accounts.type)'), $map[$scope]);
            }
            $entryIds = $entryIdQuery->pluck('id');
        }

        $entries = JournalEntry::with(['lines.account'])
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->whereBetween('date', [$from, $to])
            ->when($entryIds, fn($q) => $q->whereIn('id', $entryIds))
            ->orderBy('date')
            ->paginate(25)
            ->withQueryString();

        // Aggregates for detailed reporting
        if ($scope === 'all') {
            // Compute by normal balance so Debit vs Credit series differ in 'All'
            $totalsQ = JournalLine::select(
                    DB::raw("SUM(GREATEST(CASE WHEN LOWER(accounts.type) IN ('asset','assets','expense','expenses') THEN COALESCE(journal_lines.debit,0) - COALESCE(journal_lines.credit,0) ELSE 0 END, 0)) as total_debit"),
                    DB::raw("SUM(GREATEST(CASE WHEN LOWER(accounts.type) IN ('liability','liabilities','equity','equities','revenue','revenues','income','incomes') THEN COALESCE(journal_lines.credit,0) - COALESCE(journal_lines.debit,0) ELSE 0 END, 0)) as total_credit"),
                    DB::raw('COUNT(*) as lines_count')
                )
                ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
                ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
                ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
                ->whereBetween('bk_journal_entries.date', [$from, $to]);
        } else {
            // For specific scope/account, use raw sums so both debit and credit appear
            $totalsQ = JournalLine::select(
                    DB::raw('SUM(COALESCE(journal_lines.debit,0)) as total_debit'),
                    DB::raw('SUM(COALESCE(journal_lines.credit,0)) as total_credit'),
                    DB::raw('COUNT(*) as lines_count')
                )
                ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
                ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
                ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
                ->whereBetween('bk_journal_entries.date', [$from, $to])
                ->when($entryIds, fn($q) => $q->whereIn('bk_journal_entries.id', $entryIds));
        }
        // If we have entryIds (scoped), do not filter by accounts.* here; we want all lines on those entries
        if (!$entryIds) {
            if (str_starts_with($scope, 'account:')) {
                $code = explode(':', $scope, 2)[1] ?? '';
                if ($code !== '') { $totalsQ->where('accounts.code', $code); }
            } elseif (in_array($scope, ['assets','liabilities','revenue','expense'])) {
                $map = [
                    'assets' => ['asset','assets'],
                    'liabilities' => ['liability','liabilities'],
                    'revenue' => ['revenue','revenues','income','incomes'],
                    'expense' => ['expense','expenses'],
                ];
                $totalsQ->whereIn(DB::raw('LOWER(accounts.type)'), $map[$scope] ?? [$scope]);
            }
        }
        $totals = $totalsQ->first();

        $days = max(1, Carbon::parse($from)->diffInDays(Carbon::parse($to)) + 1);
        $weeks = max(1, (int) ceil($days / 7));
        $months = max(1, Carbon::parse($from)->diffInMonths(Carbon::parse($to)) + 1);

        if ($scope === 'all') {
            $dailyQ = JournalLine::select(
                    'bk_journal_entries.date as d',
                    DB::raw("SUM(GREATEST(CASE WHEN LOWER(accounts.type) IN ('asset','assets','expense','expenses') THEN COALESCE(journal_lines.debit,0) - COALESCE(journal_lines.credit,0) ELSE 0 END, 0)) as debit_sum"),
                    DB::raw("SUM(GREATEST(CASE WHEN LOWER(accounts.type) IN ('liability','liabilities','equity','equities','revenue','revenues','income','incomes') THEN COALESCE(journal_lines.credit,0) - COALESCE(journal_lines.debit,0) ELSE 0 END, 0)) as credit_sum")
                )
                ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
                ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
                ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
                ->whereBetween('bk_journal_entries.date', [$from, $to])
                ->groupBy('bk_journal_entries.date')
                ->orderBy('bk_journal_entries.date');
        } else {
            // For specific scope/account, use raw sums per day
            $dailyQ = JournalLine::select(
                    'bk_journal_entries.date as d',
                    DB::raw('SUM(COALESCE(journal_lines.debit,0)) as debit_sum'),
                    DB::raw('SUM(COALESCE(journal_lines.credit,0)) as credit_sum')
                )
                ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
                ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
                ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
                ->whereBetween('bk_journal_entries.date', [$from, $to])
                ->when($entryIds, fn($q) => $q->whereIn('bk_journal_entries.id', $entryIds))
                ->groupBy('bk_journal_entries.date')
                ->orderBy('bk_journal_entries.date');
        }
        if (!$entryIds) {
            if (str_starts_with($scope, 'account:')) {
                $code = explode(':', $scope, 2)[1] ?? '';
                if ($code !== '') { $dailyQ->where('accounts.code', $code); }
            } elseif (in_array($scope, ['assets','liabilities','revenue','expense'])) {
                $map = [
                    'assets' => ['asset','assets'],
                    'liabilities' => ['liability','liabilities'],
                    'revenue' => ['revenue','revenues','income','incomes'],
                    'expense' => ['expense','expenses'],
                ];
                $dailyQ->whereIn(DB::raw('LOWER(accounts.type)'), $map[$scope] ?? [$scope]);
            }
        }
        $dailySeries = $dailyQ->get();

        $byAccount = JournalLine::select(
                'accounts.code','accounts.name',
                DB::raw('SUM(journal_lines.debit) as debit_sum'),
                DB::raw('SUM(journal_lines.credit) as credit_sum')
            )
            ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
            ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
            ->whereBetween('bk_journal_entries.date', [$from, $to])
            ->when($entryIds, fn($q) => $q->whereIn('bk_journal_entries.id', $entryIds))
            ->groupBy('accounts.code','accounts.name')
            ->orderByRaw('GREATEST(SUM(journal_lines.debit), SUM(journal_lines.credit)) DESC')
            ->limit(10)
            ->get();

        $agg = [
            'totals' => [
                'debit' => round((float) ($totals->total_debit ?? 0), 2),
                'credit' => round((float) ($totals->total_credit ?? 0), 2),
                'lines' => (int) ($totals->lines_count ?? 0),
            ],
            'averages' => [
                'daily' => [
                    'debit' => round(((float) ($totals->total_debit ?? 0)) / $days, 2),
                    'credit' => round(((float) ($totals->total_credit ?? 0)) / $days, 2),
                ],
                'weekly' => [
                    'debit' => round(((float) ($totals->total_debit ?? 0)) / $weeks, 2),
                    'credit' => round(((float) ($totals->total_credit ?? 0)) / $weeks, 2),
                ],
                'monthly' => [
                    'debit' => round(((float) ($totals->total_debit ?? 0)) / $months, 2),
                    'credit' => round(((float) ($totals->total_credit ?? 0)) / $months, 2),
                ],
            ],
            'series' => $dailySeries->map(fn($r) => [
                'date' => Carbon::parse($r->d)->toDateString(),
                'debit' => round((float) $r->debit_sum, 2),
                'credit' => round((float) $r->credit_sum, 2),
            ]),
            'topAccounts' => $byAccount,
        ];

        return Inertia::render('Reports/Journals', [
            'filters' => [ 'from' => $from, 'to' => $to, 'scope' => $scope ],
            'entries' => $entries,
            'aggregates' => $agg,
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
        // Allocate purchase-level extras (tax, other charges) proportionally by units
        $avgCosts = [];
        $productQtys = [];
        $productCosts = [];
        $purchases = \App\Models\Purchase::with('items')
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
