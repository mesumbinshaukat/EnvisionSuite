<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    protected function account(string $code): Account
    {
        // Chart of accounts may be global (shop_id null), so ignore shop scope here
        return Account::withAllShops()->where('code', $code)->firstOrFail();
    }

    /**
     * Post a stock adjustment to the ledger using weighted-average cost.
     * - Positive quantity_change (gain): Dr Inventory (1200), Cr Other Income (4100)
     * - Negative quantity_change (shrinkage): Dr Misc Expenses (5900), Cr Inventory (1200)
     */
    public function postStockAdjustment(int $productId, int $shopId = null, ?int $userId = null, int $quantityChange = 0, ?string $note = null, ?int $referenceId = null): void
    {
        if ($quantityChange === 0) {
            return; // nothing to post
        }

        $date = Carbon::now()->toDateString();

        DB::transaction(function () use ($productId, $shopId, $userId, $quantityChange, $note, $referenceId, $date) {
            // Compute amount based on average cost
            $avgCost = $this->averageCost($productId, $shopId, $date);
            $amount = round(abs($quantityChange) * $avgCost, 2);

            // If average cost is zero (no purchase history), skip posting to avoid zero-value entries
            if ($amount <= 0) {
                return;
            }

            $entry = JournalEntry::create([
                'date' => $date,
                'memo' => ($note ?: 'Stock adjustment') . ' (qty ' . $quantityChange . ', product ' . $productId . ')',
                'shop_id' => $shopId,
                'user_id' => $userId,
                'reference_type' => 'stock_adjustment',
                'reference_id' => $referenceId,
            ]);

            $invAcc = $this->account('1200'); // Inventory

            if ($quantityChange > 0) {
                // Gain: increase inventory, recognize other income
                $incomeAcc = $this->account('4100'); // Other Income
                $entry->lines()->create(['account_id' => $invAcc->id, 'debit' => $amount, 'credit' => 0, 'memo' => 'Inventory increase']);
                $entry->lines()->create(['account_id' => $incomeAcc->id, 'debit' => 0, 'credit' => $amount, 'memo' => 'Inventory gain']);
            } else {
                // Loss: reduce inventory, recognize expense
                $expAcc = $this->account('5900'); // Miscellaneous Expenses
                $entry->lines()->create(['account_id' => $expAcc->id, 'debit' => $amount, 'credit' => 0, 'memo' => 'Inventory shrinkage']);
                $entry->lines()->create(['account_id' => $invAcc->id, 'debit' => 0, 'credit' => $amount, 'memo' => 'Inventory decrease']);
            }
        });
    }

    /**
     * Vendor payment: Dr Accounts Payable (2100), Cr Cash/Bank (1000/1010).
     */
    public function postVendorPayment(float $amount, string $paymentMethod, ?int $shopId, ?int $userId, ?int $referenceId = null, ?string $note = null): void
    {
        if ($amount <= 0) { return; }
        $date = Carbon::now()->toDateString();
        DB::transaction(function () use ($amount, $paymentMethod, $shopId, $userId, $referenceId, $note, $date) {
            $entry = JournalEntry::create([
                'date' => $date,
                'memo' => $note ?: 'Vendor payment',
                'shop_id' => $shopId,
                'user_id' => $userId,
                'reference_type' => 'vendor_payment',
                'reference_id' => $referenceId,
            ]);

            $ap = $this->account('2100');
            $method = strtolower($paymentMethod);
            $cashCode = in_array($method, ['card','bank','mobile','wallet','bank_transfer']) ? '1010' : '1000';
            $cash = $this->account($cashCode);

            $entry->lines()->create(['account_id' => $ap->id, 'debit' => $amount, 'credit' => 0, 'memo' => 'AP settlement']);
            $entry->lines()->create(['account_id' => $cash->id, 'debit' => 0, 'credit' => $amount, 'memo' => 'Payment out ('.$method.')']);
        });
    }

    /**
     * Customer receipt: Dr Cash/Bank (1000/1010), Cr Accounts Receivable (1100).
     */
    public function postCustomerReceipt(float $amount, string $paymentMethod, ?int $shopId, ?int $userId, ?int $referenceId = null, ?string $note = null): void
    {
        if ($amount <= 0) { return; }
        $date = Carbon::now()->toDateString();
        DB::transaction(function () use ($amount, $paymentMethod, $shopId, $userId, $referenceId, $note, $date) {
            $entry = JournalEntry::create([
                'date' => $date,
                'memo' => $note ?: 'Customer receipt',
                'shop_id' => $shopId,
                'user_id' => $userId,
                'reference_type' => 'customer_receipt',
                'reference_id' => $referenceId,
            ]);

            $ar = $this->account('1100');
            $method = strtolower($paymentMethod);
            $cashCode = in_array($method, ['card','bank','mobile','wallet','bank_transfer']) ? '1010' : '1000';
            $cash = $this->account($cashCode);

            $entry->lines()->create(['account_id' => $cash->id, 'debit' => $amount, 'credit' => 0, 'memo' => 'Payment received ('.$method.')']);
            $entry->lines()->create(['account_id' => $ar->id, 'debit' => 0, 'credit' => $amount, 'memo' => 'AR settlement']);
        });
    }

    public function postSale(Sale $sale): void
    {
        $date = Carbon::parse($sale->created_at ?? now())->toDateString();

        DB::transaction(function () use ($sale, $date) {
            $sale->loadMissing('items');
            $entry = JournalEntry::create([
                'date' => $date,
                'memo' => 'Sale #'.$sale->id,
                'shop_id' => $sale->shop_id,
                'user_id' => $sale->user_id,
                'reference_type' => Sale::class,
                'reference_id' => $sale->id,
            ]);

            $lines = [];

            $amountPaid = (float) ($sale->amount_paid ?? 0.0);
            $total = (float) $sale->total;
            $onCredit = max(0.0, $total - $amountPaid);

            // Debit Cash/Bank for amount paid now
            if ($amountPaid > 0) {
                // Simple mapping: cash->1000, card/bank/mobile/wallet->1010, else assume cash
                $method = strtolower((string) ($sale->payment_method ?? 'cash'));
                $accCode = in_array($method, ['card','bank','mobile','wallet']) ? '1010' : '1000';
                $recvAcc = $this->account($accCode);
                $lines[] = ['account_id' => $recvAcc->id, 'debit' => $amountPaid, 'credit' => 0, 'memo' => 'Payment received ('.$method.')'];
            }

            // Debit Accounts Receivable for the outstanding balance
            if ($onCredit > 0) {
                $arAcc = $this->account('1100'); // Accounts Receivable
                $lines[] = ['account_id' => $arAcc->id, 'debit' => $onCredit, 'credit' => 0, 'memo' => 'Sale on credit'];
            }

            // Credit Sales Revenue (subtotal)
            // Note: subtotal already excludes per-line discount; apply header discount as reduction of revenue
            $headerDiscount = (float) ($sale->discount ?? 0.0);
            $creditRevenue = max(0.0, (float)$sale->subtotal - $headerDiscount);
            $revAcc = $this->account('4000');
            if ($creditRevenue > 0) {
                $lines[] = ['account_id' => $revAcc->id, 'debit' => 0, 'credit' => $creditRevenue, 'memo' => 'Sales revenue'];
            }

            // Credit Tax Payable, if any
            if ((float)$sale->tax > 0) {
                $taxAcc = $this->account('2000'); // Tax Payable
                $lines[] = ['account_id' => $taxAcc->id, 'debit' => 0, 'credit' => $sale->tax, 'memo' => 'Sales tax payable'];
            }

            // COGS and Inventory movement (weighted-average unit cost as of sale date)
            $totalCogs = 0.0;
            foreach ($sale->items as $it) {
                $avgCost = $this->averageCost((int)$it->product_id, (int)$sale->shop_id, $date);
                $totalCogs += $avgCost * (int)$it->quantity;
            }
            $totalCogs = round($totalCogs, 2);
            if ($totalCogs > 0) {
                $cogsAcc = $this->account('5000'); // Cost of Goods Sold
                $invAcc = $this->account('1200'); // Inventory
                $lines[] = ['account_id' => $cogsAcc->id, 'debit' => $totalCogs, 'credit' => 0, 'memo' => 'COGS'];
                $lines[] = ['account_id' => $invAcc->id, 'debit' => 0, 'credit' => $totalCogs, 'memo' => 'Inventory reduction'];
            }

            // Persist lines
            foreach ($lines as $l) {
                $entry->lines()->create($l);
            }
        });
    }

    public function postPurchase(Purchase $purchase): void
    {
        $date = Carbon::parse($purchase->created_at ?? now())->toDateString();

        DB::transaction(function () use ($purchase, $date) {
            $entry = JournalEntry::create([
                'date' => $date,
                'memo' => 'Purchase #'.$purchase->id,
                'shop_id' => $purchase->shop_id,
                'user_id' => $purchase->user_id,
                'reference_type' => Purchase::class,
                'reference_id' => $purchase->id,
            ]);

            $lines = [];

            $amountPaid = (float) ($purchase->amount_paid ?? 0.0);
            $total = (float) $purchase->grand_total;
            $onCredit = max(0.0, $total - $amountPaid);

            // Debit Inventory for total cost (subtotal + tax + other charges)
            $inventoryValue = round(((float) ($purchase->subtotal ?? 0)) + ((float) ($purchase->tax_total ?? 0)) + ((float) ($purchase->other_charges ?? 0)), 2);
            if ($inventoryValue > 0) {
                $invAcc = $this->account('1200'); // Inventory
                $lines[] = ['account_id' => $invAcc->id, 'debit' => $inventoryValue, 'credit' => 0, 'memo' => 'Inventory purchase'];
            }

            // Credit Cash/Bank for amount paid now
            if ($amountPaid > 0) {
                $method = strtolower((string) ($purchase->payment_method ?? 'cash'));
                $accCode = in_array($method, ['card','bank','mobile','wallet']) ? '1010' : '1000';
                $payAcc = $this->account($accCode);
                $lines[] = ['account_id' => $payAcc->id, 'debit' => 0, 'credit' => $amountPaid, 'memo' => 'Payment made ('.$method.')'];
            }

            // Credit Accounts Payable for any outstanding balance
            if ($onCredit > 0) {
                $apAcc = $this->account('2100'); // Accounts Payable
                $lines[] = ['account_id' => $apAcc->id, 'debit' => 0, 'credit' => $onCredit, 'memo' => 'Purchase on credit'];
            }

            foreach ($lines as $l) {
                $entry->lines()->create($l);
            }
        });
    }

    /**
     * Get current balance (debits - credits) for an account code within a shop.
     */
    public function getAccountBalanceByCode(string $accountCode, ?int $shopId = null): float
    {
        $account = Account::where('code', $accountCode)->first();
        if (!$account) { return 0.0; }
        $bal = (float) DB::table('journal_lines as jl')
            ->join('bk_journal_entries as je', 'je.id', '=', 'jl.journal_entry_id')
            ->when($shopId, fn($q) => $q->where('je.shop_id', $shopId))
            ->where('jl.account_id', $account->id)
            ->selectRaw('COALESCE(SUM(jl.debit - jl.credit),0) as bal')
            ->value('bal');
        return round($bal, 2);
    }

    /**
     * Throw if insufficient funds in the given account code for the amount.
     */
    public function assertSufficientFundsByCode(string $accountCode, float $amount, ?int $shopId = null): void
    {
        $available = $this->getAccountBalanceByCode($accountCode, $shopId);
        if ($amount > $available) {
            abort(422, 'Insufficient balance on account '.$accountCode.'. Available: '.number_format($available, 2));
        }
    }

    /**
     * Compute weighted-average unit cost for a product in a shop up to a given date.
     */
    protected function averageCost(int $productId, ?int $shopId, string $asOfDate): float
    {
        $q = PurchaseItem::query()
            ->where('product_id', $productId)
            ->when($shopId, fn($qq) => $qq->where('shop_id', $shopId))
            ->whereHas('purchase', function($p) use ($asOfDate) {
                // If purchases table has timestamps, filter by created_at
                $p->where('created_at', '<=', $asOfDate.' 23:59:59');
            });
        $totQty = (int) (clone $q)->sum('quantity');
        if ($totQty <= 0) {
            return 0.0;
        }
        $weighted = (float) (clone $q)->selectRaw('SUM(quantity * unit_cost) as s')->value('s');
        return $totQty > 0 ? round($weighted / $totQty, 4) : 0.0;
    }
}
