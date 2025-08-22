<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Expense;
use App\Models\Shop;
use App\Models\User;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Carbon\Carbon;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $shopId = optional(Shop::first())->id;
        if (!$shopId) { return; }

        $methods = ['cash','card','bank_transfer','credited'];
        $notes = ['Utility Bill','Office Supplies','Marketing','Fuel','Miscellaneous','Internet Bill','Repair & Maintenance','Rent'];

        for ($i = 0; $i < 25; $i++) {
            $userId = ($i % 2) + 1;
            $exp = Expense::create([
                'shop_id' => $shopId,
                'user_id' => $userId,
                'date' => Carbon::now()->subDays(rand(0, 60))->toDateString(),
                'amount' => rand(500, 15000),
                'payment_method' => $methods[array_rand($methods)],
                'notes' => $notes[array_rand($notes)],
            ]);

            // Post to ledger
            $expenseCodes = ['5100','5200','5300','5400','5500','5600','5700','5800','5900'];
            $expenseAccount = Account::where('code', $expenseCodes[array_rand($expenseCodes)])->first();
            $cashAccount = Account::where('code','1000')->first();
            $bankAccount = Account::where('code','1010')->first();
            $apAccount = Account::where('code','2110')->first();
            $cardClearing = Account::where('code','2200')->first();

            $creditAccount = match($exp->payment_method) {
                'cash' => $cashAccount,
                'bank_transfer' => $bankAccount,
                'card' => $cardClearing,
                'credited' => $apAccount,
            };

            $entry = JournalEntry::create([
                'date' => $exp->date,
                'memo' => 'Expense: '.($exp->notes ?? 'Misc expense (seeded)'),
                'shop_id' => $shopId,
                'user_id' => $userId,
                'reference_type' => 'expense',
                'reference_id' => $exp->id,
            ]);
            JournalLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $expenseAccount?->id,
                'debit' => $exp->amount,
                'credit' => 0,
            ]);
            JournalLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $creditAccount?->id,
                'debit' => 0,
                'credit' => $exp->amount,
            ]);
            $exp->journal_entry_id = $entry->id;
            $exp->save();
        }
    }
}
