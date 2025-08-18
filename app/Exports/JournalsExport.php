<?php

namespace App\Exports;

use App\Models\JournalEntry;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class JournalsExport implements FromCollection, WithHeadings
{
    public function __construct(
        protected string $from,
        protected string $to,
        protected ?int $shopId = null,
    ) {}

    public function collection()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $rows = JournalEntry::with('lines.account')
            ->when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('date', [$this->from, $this->to])
            ->orderBy('date')
            ->get()
            ->flatMap(function ($e) {
                return $e->lines->map(function ($l) use ($e) {
                    return [
                        'Date' => $e->date,
                        'Memo' => $e->memo,
                        'Account' => $l->account?->code.' '.$l->account?->name,
                        'Debit' => $l->debit,
                        'Credit' => $l->credit,
                    ];
                });
            });
        return collect($rows);
    }

    public function headings(): array
    {
        return ['Date','Memo','Account','Debit','Credit'];
    }
}
