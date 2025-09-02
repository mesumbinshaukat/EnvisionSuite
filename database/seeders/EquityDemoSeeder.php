<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Shop;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;

class EquityDemoSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();
        if (!$shop) {
            $shop = Shop::create(['code' => 'MAIN', 'name' => 'Main Shop', 'currency' => 'PKR', 'is_active' => true]);
        }

        // Ensure core accounts exist (codes used by FinanceController)
        $cash = Account::where('code','1000')->first();
        $bank = Account::where('code','1010')->first();
        $inventory = Account::where('code','1200')->first();
        $receivables = Account::where('code','1100')->first();
        $payables = Account::where('code','2100')->first();
        // Fallback revenue/equity accounts for balancing
        $revenue = Account::where('code','4000')->first();
        $equity  = Account::where('code','3000')->first();

        // Post a set of journal entries to create realistic balances
        DB::transaction(function () use ($shop, $cash, $bank, $inventory, $receivables, $payables, $revenue, $equity) {
            $today = Carbon::now()->toDateString();

            // Owner investment to seed cash and bank
            if ($cash && $equity) {
                $je = JournalEntry::create([
                    'date' => $today,
                    'memo' => 'Owner investment (cash) [EquityDemo]',
                    'shop_id' => $shop->id,
                    'user_id' => 1,
                    'reference_type' => 'equitydemo_owner_cash',
                ]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$cash->id,'debit'=>50000,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$equity->id,'debit'=>0,'credit'=>50000]);
            }
            if ($bank && $equity) {
                $je = JournalEntry::create([
                    'date' => $today,
                    'memo' => 'Owner investment (bank) [EquityDemo]',
                    'shop_id' => $shop->id,
                    'user_id' => 1,
                    'reference_type' => 'equitydemo_owner_bank',
                ]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$bank->id,'debit'=>120000,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$equity->id,'debit'=>0,'credit'=>120000]);
            }

            // Purchase inventory on credit to create AP and Inventory
            if ($inventory && $payables) {
                $je = JournalEntry::create([
                    'date' => Carbon::now()->subDays(20)->toDateString(),
                    'memo' => 'Inventory purchase on credit [EquityDemo]',
                    'shop_id' => $shop->id,
                    'user_id' => 1,
                    'reference_type' => 'equitydemo_inv_credit',
                ]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$inventory->id,'debit'=>90000,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$payables->id,'debit'=>0,'credit'=>90000]);
            }

            // Customer credit sale to create AR
            if ($receivables && $revenue) {
                $je = JournalEntry::create([
                    'date' => Carbon::now()->subDays(15)->toDateString(),
                    'memo' => 'Credit sale [EquityDemo]',
                    'shop_id' => $shop->id,
                    'user_id' => 1,
                    'reference_type' => 'equitydemo_credit_sale',
                ]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$receivables->id,'debit'=>35000,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$revenue->id,'debit'=>0,'credit'=>35000]);
            }

            // Pay part of AP from bank to create liabilities realistic
            if ($payables && $bank) {
                $je = JournalEntry::create([
                    'date' => Carbon::now()->subDays(10)->toDateString(),
                    'memo' => 'Partial AP payment [EquityDemo]',
                    'shop_id' => $shop->id,
                    'user_id' => 1,
                    'reference_type' => 'equitydemo_ap_payment',
                ]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$payables->id,'debit'=>30000,'credit'=>0]);
                JournalLine::create(['journal_entry_id'=>$je->id,'account_id'=>$bank->id,'debit'=>0,'credit'=>30000]);
            }
        });

        // Seed a year of daily sales totals to power averages (last 365 days)
        $existing = DB::table('sales')->where('shop_id', $shop->id)->count();
        if ($existing < 200) {
            $start = Carbon::now()->subDays(364)->startOfDay();
            $rows = [];
            for ($i = 0; $i < 365; $i++) {
                $day = (clone $start)->addDays($i);
                // Create a realistic seasonality and randomness
                $base = 20000 + (int)(3000 * sin($i / 14)); // biweekly oscillation
                $random = random_int(-4000, 4000);
                $total = max(2000, $base + $random);
                $rows[] = [
                    'shop_id' => $shop->id,
                    'total' => $total,
                    'created_at' => $day->copy()->addHours(random_int(10, 20)),
                    'updated_at' => $day->copy()->addHours(random_int(10, 20)),
                ];
                // Insert in chunks to avoid oversized queries
                if (count($rows) >= 100) {
                    DB::table('sales')->insert($rows);
                    $rows = [];
                }
            }
            if (!empty($rows)) {
                DB::table('sales')->insert($rows);
            }
        }
    }
}
