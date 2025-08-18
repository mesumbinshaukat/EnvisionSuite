<?php

namespace App\Http\Controllers;

use App\Exports\POSReportExport;
use App\Models\Sale;
use App\Models\Shop;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class POSReportController extends Controller
{
    public function index(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $payment = $request->input('payment_method');
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        $sales = Sale::with(['customer','user'])
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->when($payment, fn($q) => $q->where('payment_method', $payment))
            ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $summary = [
            'total' => (float) Sale::when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
                ->when($payment, fn($q) => $q->where('payment_method', $payment))
                ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
                ->sum('total'),
            'count' => (int) Sale::when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
                ->when($payment, fn($q) => $q->where('payment_method', $payment))
                ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
                ->count(),
            'by_method' => Sale::selectRaw('payment_method, COUNT(*) as c, SUM(total) as s')
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
                ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
                ->groupBy('payment_method')->get(),
            'by_cashier' => Sale::selectRaw('user_id, COUNT(*) as c, SUM(total) as s')
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
                ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
                ->groupBy('user_id')->get(),
        ];

        return Inertia::render('Reports/POS', [
            'filters' => [ 'from' => $from, 'to' => $to, 'payment_method' => $payment ],
            'sales' => $sales,
            'summary' => $summary,
        ]);
    }

    public function export(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $payment = $request->input('payment_method');
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        return Excel::download(new POSReportExport($from, $to, $shopId, $payment), 'pos_report.xlsx');
    }
}
