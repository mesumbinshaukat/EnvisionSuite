<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class LedgerController extends Controller
{
    public function index()
    {
        $balances = DB::table('ledger_balances')
            ->select('currency', DB::raw('SUM(CAST(balance as decimal(24,8))) as total'))
            ->groupBy('currency')
            ->get();

        $recent = DB::table('journal_entries')
            ->orderByDesc('journalEntryId')
            ->limit(10)
            ->get(['journalEntryId','transDate','currency','description']);

        return Inertia::render('Ledger/Index', [
            'balances' => $balances,
            'recent' => $recent,
        ]);
    }
}
