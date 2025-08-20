<?php

namespace App\Exports;

use App\Models\JournalLine;
use App\Models\SaleItem;
use App\Models\Purchase;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProfitLossExport implements FromCollection, WithHeadings
{
    public function __construct(
        protected string $from,
        protected string $to,
        protected ?int $shopId = null,
    ) {}

    public function collection()
    {
        $lines = JournalLine::select('accounts.code','accounts.name','accounts.type',
                DB::raw('SUM(journal_lines.debit) as debit_sum'),
                DB::raw('SUM(journal_lines.credit) as credit_sum'))
            ->join('bk_journal_entries', 'bk_journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_lines.account_id')
            ->when($this->shopId, fn($q) => $q->where('bk_journal_entries.shop_id', $this->shopId))
            ->whereBetween('bk_journal_entries.date', [$this->from, $this->to])
            ->groupBy('accounts.code','accounts.name','accounts.type')
            ->get();

        $rows = collect();
        foreach ($lines as $l) {
            if ($l->type === 'revenue') {
                $net = (float)$l->credit_sum - (float)$l->debit_sum; // revenue normal credit
                $rows->push(['Type' => 'Revenue', 'Code' => $l->code, 'Account' => $l->name, 'Amount' => round($net, 2)]);
            } elseif ($l->type === 'expense') {
                $net = (float)$l->debit_sum - (float)$l->credit_sum; // expense normal debit
                $rows->push(['Type' => 'Expense', 'Code' => $l->code, 'Account' => $l->name, 'Amount' => round($net, 2)]);
            }
        }

        // Append computed COGS (allocated purchase extras per unit) to expenses
        $avgCosts = [];
        $productQtys = [];
        $productCosts = [];
        $purchases = Purchase::with('items')
            ->when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId))
            ->where('created_at', '<=', $this->to)
            ->get();
        foreach ($purchases as $purchase) {
            $totalUnits = (int) $purchase->items->sum('quantity');
            $extra = (float) ($purchase->tax_total ?? 0) + (float) ($purchase->other_charges ?? 0);
            $extraPerUnit = $totalUnits > 0 ? ($extra / $totalUnits) : 0.0;
            foreach ($purchase->items as $it) {
                $pid = $it->product_id;
                $q = (int) $it->quantity;
                $unitCost = (float) $it->unit_cost + $extraPerUnit;
                $productQtys[$pid] = ($productQtys[$pid] ?? 0) + $q;
                $productCosts[$pid] = ($productCosts[$pid] ?? 0.0) + ($q * $unitCost);
            }
        }
        foreach ($productQtys as $pid => $qty) {
            $cost = (float) ($productCosts[$pid] ?? 0.0);
            $avgCosts[$pid] = $qty > 0 ? ($cost / $qty) : 0.0;
        }

        $salesInPeriod = SaleItem::query()
            ->when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId))
            ->whereBetween('created_at', [$this->from, $this->to])
            ->selectRaw('product_id, SUM(quantity) as qty')
            ->groupBy('product_id')
            ->get();
        $cogs = 0.0;
        foreach ($salesInPeriod as $row) {
            $avg = (float) ($avgCosts[$row->product_id] ?? 0.0);
            $cogs += $avg * (int) $row->qty;
        }
        $cogs = round($cogs, 2);
        if ($cogs > 0) {
            $rows->push(['Type' => 'Expense', 'Code' => 'COGS', 'Account' => 'Cost of Goods Sold (computed)', 'Amount' => $cogs]);
        }
        return $rows;
    }

    public function headings(): array
    {
        return ['Type','Code','Account','Amount'];
    }
}

