<?php

namespace App\Exports;

use App\Models\JournalLine;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TrialBalanceExport implements FromCollection, WithHeadings
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
            ->orderBy('accounts.code')
            ->get()
            ->map(function ($l) {
                $debit = (float) $l->debit_sum;
                $credit = (float) $l->credit_sum;
                $balanceDebit = 0; $balanceCredit = 0;
                if (in_array($l->type, ['asset','expense'])) {
                    $net = $debit - $credit;
                    if ($net >= 0) { $balanceDebit = $net; } else { $balanceCredit = abs($net); }
                } else {
                    $net = $credit - $debit;
                    if ($net >= 0) { $balanceCredit = $net; } else { $balanceDebit = abs($net); }
                }
                return [
                    'Code' => $l->code,
                    'Account' => $l->name,
                    'Type' => $l->type,
                    'Debit' => round($balanceDebit, 2),
                    'Credit' => round($balanceCredit, 2),
                ];
            });
        return collect($lines);
    }

    public function headings(): array
    {
        return ['Code','Account','Type','Debit','Credit'];
    }
}

