<?php

namespace App\Exports;

use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Carbon\Carbon;

class CustomerAgingExport implements FromCollection, WithHeadings
{
    public function __construct(protected ?int $shopId = null) {}

    public function collection()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $today = Carbon::today();

        $receivables = Sale::select('customer_id', DB::raw('SUM(total) as amount'), DB::raw('MAX(created_at) as last_sale'))
            ->when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->where('status', 'pending')
            ->groupBy('customer_id')
            ->get()
            ->map(function ($row) use ($today) {
                $days = Carbon::parse($row->last_sale)->diffInDays($today);
                $bucket = $days <= 30 ? '0-30' : ($days <= 60 ? '31-60' : ($days <= 90 ? '61-90' : '90+'));
                return [
                    'customer_id' => $row->customer_id,
                    'amount' => (float) $row->amount,
                    'days' => $days,
                    'bucket' => $bucket,
                ];
            });

        $customers = Customer::whereIn('id', $receivables->pluck('customer_id')->all())
            ->get(['id','name','email','phone']);

        $rows = $receivables->map(function ($r) use ($customers) {
            $c = $customers->firstWhere('id', $r['customer_id']);
            return [
                'Customer' => $c?->name ?? 'Unknown',
                'Email' => $c?->email,
                'Phone' => $c?->phone,
                'Amount' => $r['amount'],
                'Days' => $r['days'],
                'Bucket' => $r['bucket'],
            ];
        });

        return collect($rows);
    }

    public function headings(): array
    {
        return ['Customer','Email','Phone','Amount','Days','Bucket'];
        }
}
