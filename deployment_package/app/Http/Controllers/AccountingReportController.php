<?php

namespace App\Http\Controllers;

use App\Exports\CustomerAgingExport;
use App\Exports\VendorBalancesExport;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AccountingReportController extends Controller
{
    public function customerAging(Request $request)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $today = Carbon::today();

        // Consider sales with status 'pending' as receivables
        $receivables = Sale::select('customer_id', DB::raw('SUM(total) as amount'), DB::raw('MAX(created_at) as last_sale'))
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
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

        $data = $receivables->map(function ($r) use ($customers) {
            $c = $customers->firstWhere('id', $r['customer_id']);
            return [
                'customer' => $c?->name ?? 'Unknown',
                'email' => $c?->email,
                'phone' => $c?->phone,
                'amount' => $r['amount'],
                'days' => $r['days'],
                'bucket' => $r['bucket'],
            ];
        })->values();

        $buckets = [
            '0-30' => $data->where('bucket','0-30')->sum('amount'),
            '31-60' => $data->where('bucket','31-60')->sum('amount'),
            '61-90' => $data->where('bucket','61-90')->sum('amount'),
            '90+' => $data->where('bucket','90+')->sum('amount'),
        ];

        return Inertia::render('Reports/CustomerAging', [
            'rows' => $data,
            'buckets' => $buckets,
        ]);
    }

    public function customerAgingExport(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        return Excel::download(new CustomerAgingExport($shopId), 'customer_aging.xlsx');
    }

    public function vendorBalances(Request $request)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        $vendors = Vendor::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        $totalBalance = (float) Vendor::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->sum('balance');

        return Inertia::render('Reports/VendorBalances', [
            'vendors' => $vendors,
            'totalBalance' => $totalBalance,
        ]);
    }

    public function vendorBalancesExport(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        return Excel::download(new VendorBalancesExport($shopId), 'vendor_balances.xlsx');
    }
}
