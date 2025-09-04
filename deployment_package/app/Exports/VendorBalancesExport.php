<?php

namespace App\Exports;

use App\Models\Vendor;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class VendorBalancesExport implements FromCollection, WithHeadings
{
    public function __construct(protected ?int $shopId = null) {}

    public function collection()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;

        $rows = Vendor::when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->orderBy('name')
            ->get()
            ->map(function ($v) {
                return [
                    'Vendor' => $v->name,
                    'Email' => $v->email,
                    'Phone' => $v->phone,
                    'Balance' => $v->balance,
                ];
            });
        return collect($rows);
    }

    public function headings(): array
    {
        return ['Vendor','Email','Phone','Balance'];
    }
}
