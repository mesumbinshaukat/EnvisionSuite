<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Sale;
use App\Models\PurchaseItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    protected function account(string $code): Account
    {
        return Account::where('code', $code)->firstOrFail();
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
