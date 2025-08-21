<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Account;
use App\Models\Shop;
use App\Models\User;
use Carbon\Carbon;

class JournalActivitySeeder extends Seeder
{
    public function run(): void
    {
        $shopId = optional(Shop::first())->id;
        $userId = optional(User::first())->id;
        if (!$shopId || !$userId) return;

        $cash = Account::where('code','1000')->first();
        $bank = Account::where('code','1010')->first();
        $ar   = Account::where('code','1100')->first();
        $ap   = Account::where('code','2100')->first();
        $rev  = Account::where('code','4000')->first();
        $otherRev = Account::where('code','4100')->first();
        $expUtilities = Account::where('code','5300')->first();
        $expMarketing = Account::where('code','5400')->first();

        $start = Carbon::now()->subDays(45);
        $days = 40;
        for ($i=0; $i<$days; $i++) {
            $date = (clone $start)->addDays($i)->toDateString();

            // Randomly choose pathways to create non-symmetric daily flows by scope
            // 1) Cash sales (Debit Cash, Credit Revenue)
            if (rand(0,1)) {
                $amt = rand(2000, 15000);
                $entry = JournalEntry::create([
                    'date' => $date,
                    'memo' => 'Cash Sale',
                    'shop_id' => $shopId,
                    'user_id' => $userId,
                    'reference_type' => 'seed_cash_sale',
                ]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$cash?->id,'debit'=>$amt,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$rev?->id,'debit'=>0,'credit'=>$amt]);
            }

            // 2) Credit sales (Debit AR, Credit Revenue)
            if (rand(0,1)) {
                $amt = rand(3000, 12000);
                $entry = JournalEntry::create([
                    'date' => $date,
                    'memo' => 'Credit Sale',
                    'shop_id' => $shopId,
                    'user_id' => $userId,
                    'reference_type' => 'seed_credit_sale',
                ]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$ar?->id,'debit'=>$amt,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$rev?->id,'debit'=>0,'credit'=>$amt]);
            }

            // 3) Customer receipts (Debit Bank, Credit AR)
            if (rand(0,1)) {
                $amt = rand(1500, 9000);
                $entry = JournalEntry::create([
                    'date' => $date,
                    'memo' => 'Customer Receipt',
                    'shop_id' => $shopId,
                    'user_id' => $userId,
                    'reference_type' => 'seed_receipt',
                ]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$bank?->id,'debit'=>$amt,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$ar?->id,'debit'=>0,'credit'=>$amt]);
            }

            // 4) Vendor bill (Debit Expense, Credit AP)
            if (rand(0,1)) {
                $amt = rand(1000, 8000);
                $expenseAcc = (rand(0,1) ? $expUtilities : $expMarketing);
                $entry = JournalEntry::create([
                    'date' => $date,
                    'memo' => 'Vendor Bill',
                    'shop_id' => $shopId,
                    'user_id' => $userId,
                    'reference_type' => 'seed_vendor_bill',
                ]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$expenseAcc?->id,'debit'=>$amt,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$ap?->id,'debit'=>0,'credit'=>$amt]);
            }

            // 5) Vendor payment (Debit AP, Credit Bank)
            if (rand(0,1)) {
                $amt = rand(800, 7000);
                $entry = JournalEntry::create([
                    'date' => $date,
                    'memo' => 'Vendor Payment',
                    'shop_id' => $shopId,
                    'user_id' => $userId,
                    'reference_type' => 'seed_vendor_payment',
                ]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$ap?->id,'debit'=>$amt,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$bank?->id,'debit'=>0,'credit'=>$amt]);
            }

            // 6) Other income (Debit Bank, Credit Other Income)
            if (rand(0,3) === 0) { // less frequent
                $amt = rand(500, 5000);
                $entry = JournalEntry::create([
                    'date' => $date,
                    'memo' => 'Other Income',
                    'shop_id' => $shopId,
                    'user_id' => $userId,
                    'reference_type' => 'seed_other_income',
                ]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$bank?->id,'debit'=>$amt,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$otherRev?->id,'debit'=>0,'credit'=>$amt]);
            }
        }
    }
}
