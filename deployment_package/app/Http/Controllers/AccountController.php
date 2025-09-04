<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\JournalLine;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->input('q', ''));
        $status = $request->input('status', 'all'); // all|open|closed
        $type = $request->input('type'); // optional filter
        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        $query = Account::query()
            ->when($shopId, fn($qq) => $qq->where(function($w) use ($shopId) {
                $w->whereNull('shop_id')->orWhere('shop_id', $shopId);
            }))
            ->when($q !== '', fn($qq) => $qq->where(function($w) use ($q) {
                $w->where('name', 'like', "%$q%")->orWhere('code', 'like', "%$q%");
            }))
            ->when(in_array($status, ['open','closed']), fn($qq) => $qq->where('is_closed', $status === 'closed'))
            ->when($type, fn($qq) => $qq->where('type', $type))
            ->orderBy('code');

        $accounts = $query->paginate(10)->withQueryString();

        // Compute balances for listed accounts only
        $ids = collect($accounts->items())->pluck('id')->all();
        $balances = [];
        if (!empty($ids)) {
            $rows = DB::table('journal_lines as jl')
                ->join('bk_journal_entries as je', 'je.id', '=', 'jl.journal_entry_id')
                ->when($shopId, fn($qq) => $qq->where(function($w) use ($shopId) { $w->whereNull('je.shop_id')->orWhere('je.shop_id', $shopId); }))
                ->whereIn('jl.account_id', $ids)
                ->select('jl.account_id', DB::raw('COALESCE(SUM(jl.debit - jl.credit),0) as bal'))
                ->groupBy('jl.account_id')
                ->get();
            foreach ($rows as $r) { $balances[$r->account_id] = (float) $r->bal; }
        }

        return Inertia::render('Accounting/Accounts/Index', [
            'filters' => [ 'q' => $q, 'status' => $status, 'type' => $type ],
            'accounts' => $accounts,
            'balances' => $balances,
        ]);
    }

    public function show(int $id, Request $request)
    {
        $account = Account::findOrFail($id);
        $from = $request->input('from');
        $to = $request->input('to');
        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        $lines = JournalLine::query()
            ->with(['entry'])
            ->where('account_id', $account->id)
            ->whereHas('entry', function($q) use ($shopId, $from, $to) {
                $q->when($shopId, fn($w) => $w->where(function($ww) use ($shopId){ $ww->whereNull('shop_id')->orWhere('shop_id',$shopId);}));
                $q->when($from, fn($w) => $w->where('date', '>=', $from));
                $q->when($to, fn($w) => $w->where('date', '<=', $to));
            })
            ->get(['id','journal_entry_id','account_id','debit','credit','memo']);

        $events = [];
        foreach ($lines as $line) {
            $date = optional($line->entry->date)->toDateString() ?: optional($line->entry->created_at)->toDateString();
            $events[] = [
                'id' => $line->id,
                'date' => $date,
                'memo' => $line->memo ?: ($line->entry->memo ?? ''),
                'debit' => (float)$line->debit,
                'credit' => (float)$line->credit,
            ];
        }
        usort($events, fn($a,$b) => strcmp($a['date'], $b['date']));

        $running = 0.0; $series = [];
        foreach ($events as &$e) {
            $running += ($e['debit'] - $e['credit']);
            $e['balance'] = round($running, 2);
            $series[$e['date']] = ($series[$e['date']] ?? 0) + ($e['debit'] - $e['credit']);
        } unset($e);

        $chart = [
            'labels' => array_keys($series),
            'datasets' => [[
                'label' => 'Net change',
                'backgroundColor' => '#2563eb',
                'borderColor' => '#2563eb',
                'fill' => false,
                'data' => array_values(array_map(fn($v) => round($v,2), $series)),
            ]],
        ];

        return Inertia::render('Accounting/Accounts/Show', [
            'account' => $account,
            'filters' => [ 'from' => $from, 'to' => $to ],
            'transactions' => $events,
            'totals' => [ 'balance' => round($running,2) ],
            'chart' => $chart,
        ]);
    }

    public function destroy(int $id)
    {
        $account = Account::findOrFail($id);
        $hasLines = JournalLine::where('account_id', $account->id)->exists();
        if ($hasLines) {
            abort(422, 'Cannot delete: account has journal entries.');
        }
        $account->delete();
        return redirect()->route('accounts.index')->with('success', 'Account deleted');
    }
}
