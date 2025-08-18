<?php

namespace App\Exports;

use App\Models\Sale;
use App\Models\Shop;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class POSReportExport implements FromCollection, WithHeadings
{
    public function __construct(
        protected string $from,
        protected string $to,
        protected ?int $shopId = null,
        protected ?string $paymentMethod = null
    ) {}

    public function collection()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;

        $rows = Sale::with(['customer','user'])
            ->when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->when($this->paymentMethod, fn($q) => $q->where('payment_method', $this->paymentMethod))
            ->whereBetween('created_at', [$this->from.' 00:00:00', $this->to.' 23:59:59'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($s) {
                return [
                    'ID' => $s->id,
                    'Date' => $s->created_at->toDateTimeString(),
                    'Customer' => $s->customer?->name,
                    'Cashier' => $s->user?->name,
                    'Payment' => $s->payment_method,
                    'Subtotal' => $s->subtotal,
                    'Discount' => $s->discount,
                    'Tax' => $s->tax,
                    'Total' => $s->total,
                ];
            });
        return collect($rows);
    }

    public function headings(): array
    {
        return ['ID','Date','Customer','Cashier','Payment','Subtotal','Discount','Tax','Total'];
    }
}
