<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Models\Shop;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        $salesQuery = Sale::query();
        if ($shopId) { $salesQuery->where('shop_id', $shopId); }
        if (!$isSuper) { $salesQuery->where('user_id', $user?->id); }

        $salesToday = (clone $salesQuery)->whereDate('created_at', $today)->sum('total');
        $salesMonth = (clone $salesQuery)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->sum('total');
        $ordersCount = (clone $salesQuery)->count();

        $productsQuery = Product::query();
        if ($shopId) { $productsQuery->where('shop_id', $shopId); }
        $productsCount = $productsQuery->count();
        $lowStock = (clone $productsQuery)->whereNotNull('stock')->where('stock', '<', 5)->orderBy('stock')->take(5)->get(['id','name','sku','stock']);

        // Ledger snapshot (safe fallbacks if tables empty)
        $ledgerAccounts = DB::table('ledger_accounts')->count();
        $ledgerBalances = DB::table('ledger_balances')
            ->select('currency', DB::raw('SUM(CAST(balance as decimal(24,8))) as total'))
            ->groupBy('currency')
            ->get();

        // Pricing aggregates from sale items
        $itemsQuery = \App\Models\SaleItem::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->whereHas('sale', function($q) use ($user, $isSuper) {
                $q->when(!$isSuper, fn($qq) => $qq->where('user_id', $user?->id));
            });
        $totalQty = (int) (clone $itemsQuery)->sum('quantity');
        $weightedSum = (float) (clone $itemsQuery)->selectRaw('SUM(quantity * COALESCE(sold_unit_price, unit_price)) as s')->value('s') ?? 0.0;
        $avgSoldPrice = $totalQty > 0 ? round($weightedSum / $totalQty, 2) : 0.0;
        $originalUnits = (int) (clone $itemsQuery)->where(function($q){
            $q->where('is_discounted', false)->orWhereNull('is_discounted');
        })->sum('quantity');
        $discountedUnits = (int) (clone $itemsQuery)->where('is_discounted', true)->sum('quantity');

        // Lent-out inventory total
        $lentOutTotal = (int) \App\Models\InventoryLoan::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->selectRaw('SUM(GREATEST(quantity - returned_quantity, 0)) as lent')
            ->value('lent');

        return Inertia::render('Dashboard', [
            'kpis' => [
                'salesToday' => (float) $salesToday,
                'salesMonth' => (float) $salesMonth,
                'ordersCount' => $ordersCount,
                'productsCount' => $productsCount,
                'ledgerAccounts' => $ledgerAccounts,
                'avgSoldPrice' => $avgSoldPrice,
                'unitsOriginal' => $originalUnits,
                'unitsDiscounted' => $discountedUnits,
                'lentOutTotal' => (int) ($lentOutTotal ?? 0),
            ],
            'lowStock' => $lowStock,
            'ledgerBalances' => $ledgerBalances,
        ]);
    }
}
