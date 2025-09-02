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
        $bucket = $request->input('bucket', 'daily'); // daily | weekly | monthly
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
        $bucket = $request->input('bucket', 'daily'); // daily | weekly | monthly
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
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->whereBetween('sale_items.created_at', [$from, $to])
            ->selectRaw('sale_items.product_id, SUM(sale_items.quantity) as qty')
            ->groupBy('sale_items.product_id')
            ->get();

        $cogs = 0.0;
        foreach ($salesInPeriod as $row) {
            $avg = (float) ($avgCosts[$row->product_id] ?? 0.0);
            $cogs += $avg * (int) $row->qty;
        }
        $cogs = round($cogs, 2);

        $profit = $revenue - ($expense + $cogs);
        $grossProfit = $revenue - $cogs;
        $grossMarginPct = $revenue > 0 ? round(($grossProfit / $revenue) * 100, 2) : null;
        $operatingExpense = $expense; // expense excludes COGS by construction; UI shows expense + COGS separately

        // Build daily series for revenue/expense using journal_lines and computed daily COGS
        $dailyRevenue = JournalLine::select(
                'bk_journal_entries.date as d',
                DB::raw("SUM(GREATEST(CASE WHEN LOWER(accounts.type) IN ('revenue','revenues','income','incomes') THEN COALESCE(journal_lines.credit,0) - COALESCE(journal_lines.debit,0) ELSE 0 END, 0)) as rev")
            )
            ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
            ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
            ->whereBetween('bk_journal_entries.date', [$from, $to])
            ->groupBy('bk_journal_entries.date')
            ->orderBy('bk_journal_entries.date')
            ->pluck('rev', 'd');
        $dailyExpense = JournalLine::select(
                'bk_journal_entries.date as d',
                DB::raw("SUM(GREATEST(CASE WHEN LOWER(accounts.type) IN ('expense','expenses') THEN COALESCE(journal_lines.debit,0) - COALESCE(journal_lines.credit,0) ELSE 0 END, 0)) as exp")
            )
            ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
            ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
            ->whereBetween('bk_journal_entries.date', [$from, $to])
            ->groupBy('bk_journal_entries.date')
            ->orderBy('bk_journal_entries.date')
            ->pluck('exp', 'd');
        // Daily COGS by multiplying quantities sold each day by avg cost per product
        $salesDaily = SaleItem::query()
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->whereBetween('sale_items.created_at', [$from, $to])
            ->selectRaw("DATE(sale_items.created_at) as d, sale_items.product_id, SUM(sale_items.quantity) as qty")
            ->groupBy(DB::raw('DATE(sale_items.created_at)'), 'sale_items.product_id')
            ->orderBy(DB::raw('DATE(sale_items.created_at)'))
            ->get();
        $dailyCogsMap = [];
        foreach ($salesDaily as $row) {
            $avg = (float) ($avgCosts[$row->product_id] ?? 0.0);
            $dailyCogsMap[$row->d] = ($dailyCogsMap[$row->d] ?? 0.0) + ($avg * (int) $row->qty);
        }
        // Normalize series across the full date range
        $cursor = Carbon::parse($from)->copy();
        $end = Carbon::parse($to)->copy();
        $series = [];
        while ($cursor->lte($end)) {
            $d = $cursor->toDateString();
            $rev = (float) ($dailyRevenue[$d] ?? 0.0);
            $exp = (float) ($dailyExpense[$d] ?? 0.0);
            $dcogs = (float) round($dailyCogsMap[$d] ?? 0.0, 2);
            $series[] = [
                'date' => $d,
                'revenue' => round($rev, 2),
                'expense' => round($exp, 2),
                'cogs' => $dcogs,
                'gross' => round($rev - $dcogs, 2),
            ];
            $cursor->addDay();
        }

        // Re-bucket series if needed
        if (in_array($bucket, ['weekly','monthly'])) {
            $bucketed = [];
            foreach ($series as $pt) {
                $key = $bucket === 'weekly' ? Carbon::parse($pt['date'])->startOfWeek()->toDateString() : Carbon::parse($pt['date'])->startOfMonth()->toDateString();
                if (!isset($bucketed[$key])) { $bucketed[$key] = ['date' => $key, 'revenue'=>0.0,'expense'=>0.0,'cogs'=>0.0,'gross'=>0.0]; }
                $bucketed[$key]['revenue'] += (float) $pt['revenue'];
                $bucketed[$key]['expense'] += (float) $pt['expense'];
                $bucketed[$key]['cogs'] += (float) $pt['cogs'];
                $bucketed[$key]['gross'] += (float) $pt['gross'];
            }
            ksort($bucketed);
            $series = array_values(array_map(function($v){
                $v['revenue'] = round($v['revenue'],2);
                $v['expense'] = round($v['expense'],2);
                $v['cogs'] = round($v['cogs'],2);
                $v['gross'] = round($v['gross'],2);
                return $v;
            }, $bucketed));
        }

        // Period comparisons (previous period and YoY)
        $fromDt = Carbon::parse($from); $toDt = Carbon::parse($to);
        $periodDays = max(1, $fromDt->diffInDays($toDt) + 1);
        $prevFrom = $fromDt->copy()->subDays($periodDays); $prevTo = $toDt->copy()->subDays($periodDays);
        $yoyFrom = $fromDt->copy()->subYear(); $yoyTo = $toDt->copy()->subYear();

        $cmp = function(string $a, string $b) use ($shopId) {
            $tb = app(self::class)->trialBalanceData($a, $b, $shopId);
            $rev = collect($tb['rows'])->where('type','revenue')->sum('credit');
            $exp = collect($tb['rows'])->where('type','expense')->sum('debit');
            // Compute COGS analogue
            $avgCosts = [];$productQtys=[];$productCosts=[];
            $purchases = \App\Models\Purchase::with('items')
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->where('created_at', '<=', $b)->get();
            foreach ($purchases as $purchase) {
                $totalUnits = (int) $purchase->items->sum('quantity');
                $extra = (float) ($purchase->tax_total ?? 0) + (float) ($purchase->other_charges ?? 0);
                $extraPerUnit = $totalUnits > 0 ? ($extra / $totalUnits) : 0.0;
                foreach ($purchase->items as $it) {
                    $pid = $it->product_id; $q = (int) $it->quantity; $unitCost = (float) $it->unit_cost + $extraPerUnit;
                    $productQtys[$pid] = ($productQtys[$pid] ?? 0) + $q;
                    $productCosts[$pid] = ($productCosts[$pid] ?? 0.0) + ($q * $unitCost);
                }
            }
            foreach ($productQtys as $pid=>$qty) { $cost = (float) ($productCosts[$pid] ?? 0.0); $avgCosts[$pid] = $qty > 0 ? ($cost / $qty) : 0.0; }
            $sales = SaleItem::query()->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->whereBetween('created_at', [$a, $b])->selectRaw('product_id, SUM(quantity) as qty')->groupBy('product_id')->get();
            $cogs = 0.0; foreach ($sales as $row) { $avg = (float) ($avgCosts[$row->product_id] ?? 0.0); $cogs += $avg * (int) $row->qty; }
            $cogs = round($cogs, 2);
            return [
                'revenue' => $rev,
                'expense' => $exp,
                'cogs' => $cogs,
                'gross' => $rev - $cogs,
                'profit' => $rev - ($exp + $cogs),
            ];
        };
        $comparePrev = $cmp($prevFrom->toDateString(), $prevTo->toDateString());
        $compareYoy = $cmp($yoyFrom->toDateString(), $yoyTo->toDateString());

        // Top contributors (products and customers) within period
        $topProducts = SaleItem::query()
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->whereBetween('sale_items.created_at', [$from, $to])
            ->selectRaw('sale_items.product_id, SUM(sale_items.quantity) as qty, SUM(sale_items.total) as revenue')
            ->groupBy('sale_items.product_id')
            ->get()
            ->map(function($row) use ($avgCosts) {
                $cogs = ((float) ($avgCosts[$row->product_id] ?? 0.0)) * (int) $row->qty;
                return [
                    'product_id' => $row->product_id,
                    'qty' => (int) $row->qty,
                    'revenue' => round((float) $row->revenue, 2),
                    'cogs' => round($cogs, 2),
                    'gross' => round(((float) $row->revenue) - $cogs, 2),
                ];
            });
        // Attach product names
        $productNames = \App\Models\Product::whereIn('id', $topProducts->pluck('product_id')->filter())->pluck('name','id');
        $topProducts = $topProducts->map(function($r) use ($productNames){ $r['name'] = $productNames[$r['product_id']] ?? ('Product #'.$r['product_id']); return $r; })->sortByDesc('gross')->values()->take(10);

        $topCustomers = SaleItem::query()
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->whereBetween('sale_items.created_at', [$from, $to])
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->selectRaw('sales.customer_id as customer_id, SUM(sale_items.quantity) as qty, SUM(sale_items.total) as revenue')
            ->groupBy('sales.customer_id')
            ->get()
            ->map(function($row) use ($avgCosts) {
                // We don't have per-customer product mix here; approximate COGS via average unit cogs per product requires per-item grouping
                // Compute per-customer cogs precisely by re-querying items for that customer
                $cogs = 0.0;
                return [
                    'customer_id' => $row->customer_id,
                    'qty' => (int) $row->qty,
                    'revenue' => round((float) $row->revenue, 2),
                    'cogs' => $cogs,
                    'gross' => round(((float) $row->revenue) - $cogs, 2),
                ];
            });
        // Precise per-customer COGS: group items by customer and product
        $perCustItems = SaleItem::query()
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->whereBetween('sale_items.created_at', [$from, $to])
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->selectRaw('sales.customer_id as customer_id, sale_items.product_id, SUM(sale_items.quantity) as qty')
            ->groupBy('sales.customer_id','sale_items.product_id')
            ->get();
        $custCogs = [];
        foreach ($perCustItems as $r) { $avg = (float) ($avgCosts[$r->product_id] ?? 0.0); $custCogs[$r->customer_id ?? 0] = ($custCogs[$r->customer_id ?? 0] ?? 0.0) + ($avg * (int) $r->qty); }
        $topCustomers = $topCustomers->map(function($r) use ($custCogs){ $cid = $r['customer_id'] ?? 0; $r['cogs'] = round((float) ($custCogs[$cid] ?? 0.0), 2); $r['gross'] = round(((float) $r['revenue']) - $r['cogs'], 2); return $r; });
        // Attach customer names (with Walk-in for null)
        $customerNames = \App\Models\Customer::whereIn('id', $topCustomers->pluck('customer_id')->filter())->pluck('name','id');
        $topCustomers = $topCustomers->map(function($r) use ($customerNames){ $r['name'] = $r['customer_id'] ? ($customerNames[$r['customer_id']] ?? ('Customer #'.$r['customer_id'])) : 'Walk-in Customer'; return $r; })->sortByDesc('gross')->values()->take(10);

        return Inertia::render('Reports/ProfitLoss', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'revenue' => $revenue,
            'expense' => $expense + $cogs,
            'profit' => $profit,
            // Enhancements
            'operatingExpense' => $operatingExpense,
            'grossProfit' => $grossProfit,
            'grossMarginPct' => $grossMarginPct,
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
            'series' => $series,
            'bucket' => $bucket,
            'compare' => [
                'previous' => $comparePrev,
                'yoy' => $compareYoy,
            ],
            'top' => [
                'products' => $topProducts,
                'customers' => $topCustomers,
            ],
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
