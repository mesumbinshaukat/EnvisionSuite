<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Shop;
use App\Models\Vendor;
use App\Models\VendorPayment;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Services\LedgerService;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure a main shop exists and set currency to PKR for UI consistency
        $shop = Shop::firstOrCreate(
            ['code' => 'MAIN'],
            ['name' => 'Main Shop', 'currency' => 'PKR', 'is_active' => true]
        );
        if ($shop->currency !== 'PKR') {
            $shop->currency = 'PKR';
            $shop->save();
        }

        // Run core data seeders to cover all pages
        $this->call(ChartOfAccountsSeeder::class);
        $this->call(LedgerBootstrapSeeder::class);
        $this->call(SampleDataSeeder::class);
        $this->call(ComprehensiveDataSeeder::class);
        $this->call(PurchaseDataSeeder::class);
        $this->call(ExpenseSeeder::class);
        $this->call(JournalActivitySeeder::class);
        $this->call(ProfitLossDemoSeeder::class);

        // Create a handful of vendor payments across different methods to light up dashboards
        $vendors = Vendor::where('shop_id', $shop->id)->take(5)->get();
        if ($vendors->count() > 0) {
            DB::transaction(function () use ($vendors, $shop) {
                $service = app(LedgerService::class);
                foreach ($vendors as $idx => $vendor) {
                    $amount = [2500, 4200, 1500, 6000, 3300][$idx % 5];
                    $method = ($idx % 2 === 0) ? 'cash' : 'bank_transfer';
                    $date = Carbon::now()->subDays(rand(0,6))->toDateString();

                    $payment = VendorPayment::create([
                        'shop_id' => $shop->id,
                        'user_id' => 1,
                        'vendor_id' => $vendor->id,
                        'date' => $date,
                        'amount' => $amount,
                        'payment_method' => $method,
                        'notes' => 'Seed vendor payment',
                    ]);

                    // Post to ledger and adjust vendor running balance similar to controller logic
                    $service->postVendorPayment((float) $amount, $method, $shop->id, 1, $payment->id, 'Seed Vendor payment #'.$payment->id);

                    $vendor->balance = round(((float)($vendor->balance ?? 0)) + (float)$amount, 2);
                    $vendor->save();
                }
            });
        }

        // A few direct journal entries to ensure trial balance has a variety of accounts
        $bank = Account::where('code','1010')->first();
        $cash = Account::where('code','1000')->first();
        $ar   = Account::where('code','1100')->first();
        $ap   = Account::where('code','2100')->first();
        $rev  = Account::where('code','4000')->first();
        $otherRev = Account::where('code','4100')->first();
        $expUtilities = Account::where('code','5300')->first();
        $expMarketing = Account::where('code','5400')->first();
        $expDep       = Account::where('code','5600')->first(); // assume depreciation exists

        $today = Carbon::now()->toDateString();

        // Utilities bill (Debit Utilities Expense, Credit AP)
        if ($expUtilities && $ap) {
            $entry = JournalEntry::create([
                'date' => $today,
                'memo' => 'Seed Utilities Bill',
                'shop_id' => $shop->id,
                'user_id' => 1,
                'reference_type' => 'seed_util_bill_direct',
            ]);
            JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$expUtilities->id,'debit'=>3800,'credit'=>0]);
            JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$ap->id,'debit'=>0,'credit'=>3800]);
        }

        // Pay vendor bill from bank (Debit AP, Credit Bank)
        if ($ap && $bank) {
            $entry = JournalEntry::create([
                'date' => $today,
                'memo' => 'Seed Vendor Bill Payment',
                'shop_id' => $shop->id,
                'user_id' => 1,
                'reference_type' => 'seed_ap_payment_direct',
            ]);
            JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$ap->id,'debit'=>3000,'credit'=>0]);
            JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$bank->id,'debit'=>0,'credit'=>3000]);
        }

        // Other income received in cash (Debit Cash, Credit Other Income)
        if ($cash && $otherRev) {
            $entry = JournalEntry::create([
                'date' => $today,
                'memo' => 'Seed Misc Income',
                'shop_id' => $shop->id,
                'user_id' => 1,
                'reference_type' => 'seed_other_income_direct',
            ]);
            JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$cash->id,'debit'=>2200,'credit'=>0]);
            JournalLine::create(['journal_entry_id'=>$entry->id,'account_id'=>$otherRev->id,'debit'=>0,'credit'=>2200]);
        }

        // Optional depreciation (Debit Depreciation Expense, Credit Accumulated Depreciation if defined)
        // Skip if accounts are not present to avoid seeder failure
    }
}
