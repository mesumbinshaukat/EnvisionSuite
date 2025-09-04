<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\LedgerService;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;

        $expenses = Expense::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('date', [$from, $to])
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        $total = (float) Expense::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('date', [$from, $to])
            ->sum('amount');

        return Inertia::render('Expenses/Index', [
            'filters' => ['from' => $from, 'to' => $to],
            'expenses' => $expenses,
            'total' => $total,
        ]);
    }

    public function create()
    {
        return Inertia::render('Expenses/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => ['required','date'],
            'amount' => ['required','numeric','min:0.01'],
            'payment_method' => ['required','in:cash,card,bank_transfer,credited'],
            'notes' => ['nullable','string','max:255'],
        ]);

        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $user = Auth::user();

        // Prevent overdraft when paying via bank transfer (credits bank 1010)
        if (($data['payment_method'] ?? null) === 'bank_transfer') {
            $available = app(LedgerService::class)->getAccountBalanceByCode('1010', $shopId);
            if ((float)$data['amount'] > $available) {
                return back()->withErrors(['amount' => 'Insufficient bank balance (1010). Available: Rs '.number_format($available, 2)]);
            }
        }

        return DB::transaction(function() use ($data, $shopId, $user) {
            $expense = Expense::create([
                'shop_id' => $shopId,
                'user_id' => $user?->id,
                'date' => $data['date'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? null,
            ]);

            // Ledger posting: Debit an expense (5900 Misc) by default; credit payment source.
            $expenseAccount = Account::where('code','5900')->first();
            $cashAccount = Account::where('code','1000')->first();
            $bankAccount = Account::where('code','1010')->first();
            $apAccount = Account::where('code','2110')->first(); // other payables
            $cardClearing = Account::where('code','2200')->first(); // accrued expenses as a proxy for card

            $creditAccount = match($data['payment_method']) {
                'cash' => $cashAccount,
                'bank_transfer' => $bankAccount,
                'card' => $cardClearing,
                'credited' => $apAccount,
            };

            $entry = JournalEntry::create([
                'date' => $data['date'],
                'memo' => 'Expense: '.($data['notes'] ?? 'Misc expense'),
                'shop_id' => $shopId,
                'user_id' => $user?->id,
                'reference_type' => 'expense',
                'reference_id' => $expense->id,
            ]);

            JournalLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $expenseAccount?->id,
                'debit' => $data['amount'],
                'credit' => 0,
            ]);
            JournalLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $creditAccount?->id,
                'debit' => 0,
                'credit' => $data['amount'],
            ]);

            $expense->journal_entry_id = $entry->id;
            $expense->save();

            return redirect()->route('expenses.index')->with('success', 'Expense recorded successfully.');
        });
    }
}
