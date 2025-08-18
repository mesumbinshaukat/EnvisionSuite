<?php

namespace App\Exports;

use App\Models\JournalLine;
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
        return $rows;
    }

    public function headings(): array
    {
        return ['Type','Code','Account','Amount'];
    }
}

