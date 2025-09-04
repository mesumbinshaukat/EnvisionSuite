<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Models\Shop;

class LedgerController extends Controller
{
    public function index(Request $request)
    {
        $from = $request->input('from');
        $to = $request->input('to');

        // Derive user and shop context; superadmin bypasses user filter
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::where('user_id', Auth::id())->first())->id;

        $base = DB::table('journal_lines')
            ->join('bk_journal_entries','bk_journal_entries.id','=','journal_lines.journal_entry_id')
            ->join('accounts','accounts.id','=','journal_lines.account_id')
            ->when($shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('bk_journal_entries.user_id', $user?->id))
            ->when($from, fn($q)=>$q->where('bk_journal_entries.date','>=',$from))
            ->when($to, fn($q)=>$q->where('bk_journal_entries.date','<=',$to));

        $sumFor = function($query, $nameLike = null, $typeIn = null) {
            $q = (clone $query);
            if ($nameLike) {
                $q->where(function($qq) use ($nameLike){
                    foreach ($nameLike as $pat) {
                        $qq->orWhere('accounts.name','like',$pat);
                    }
                });
            }
            if ($typeIn) {
                $q->whereIn(DB::raw('LOWER(accounts.type)'), $typeIn);
            }
            $row = $q->selectRaw(
                "SUM(CASE WHEN LOWER(accounts.type) IN ('asset','assets','expense','expenses') THEN COALESCE(journal_lines.debit,0) - COALESCE(journal_lines.credit,0) ELSE 0 END) as dsum, " .
                "SUM(CASE WHEN LOWER(accounts.type) IN ('liability','liabilities','equity','equities','revenue','revenues','income','incomes') THEN COALESCE(journal_lines.credit,0) - COALESCE(journal_lines.debit,0) ELSE 0 END) as csum"
            )->first();
            $assetSide = (float) ($row->dsum ?? 0);
            $liabSide = (float) ($row->csum ?? 0);
            return round($assetSide + $liabSide, 2);
        };

        // Heuristic groupings
        $cashOnHand = $sumFor($base, ['%cash%','%petty%','%till%'], ['asset','assets']);
        $bankBalance = $sumFor($base, ['%bank%','%checking%','%current account%'], ['asset','assets']);
        // Credit: liabilities payable and credit cards
        $creditBalance = $sumFor($base, ['%payable%','%credit card%','%vendor%'], ['liability','liabilities']);

        // Recent entries
        $recent = DB::table('bk_journal_entries')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user?->id))
            ->orderByDesc('date')
            ->limit(20)
            ->get(['id','date','memo']);

        // Top accounts by absolute movement in window
        $balanceExpr = "SUM(CASE WHEN LOWER(accounts.type) IN ('asset','assets','expense','expenses') THEN COALESCE(journal_lines.debit,0) - COALESCE(journal_lines.credit,0) ELSE COALESCE(journal_lines.credit,0) - COALESCE(journal_lines.debit,0) END)";

        $topAccounts = (clone $base)
            ->groupBy('accounts.id','accounts.name','accounts.type')
            ->selectRaw("accounts.id, accounts.name, accounts.type, " .
                "SUM(COALESCE(journal_lines.debit,0)) as debit_sum, SUM(COALESCE(journal_lines.credit,0)) as credit_sum, " .
                "$balanceExpr as balance")
            ->orderByDesc(DB::raw("ABS($balanceExpr)"))
            ->limit(10)
            ->get();

        return Inertia::render('Ledger/Index', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'kpis' => [
                'cash_on_hand' => $cashOnHand,
                'bank_balance' => $bankBalance,
                'credit_balance' => $creditBalance,
            ],
            'recent' => $recent,
            'topAccounts' => $topAccounts,
            // Defensive: in case a shared component expects a bucket prop
            'bucket' => 'daily',
        ]);
    }
}
