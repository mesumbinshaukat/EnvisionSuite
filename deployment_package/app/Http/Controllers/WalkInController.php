<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Shop;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class WalkInController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $from = $request->input('from');
        $to = $request->input('to');

        // Base sales query: walk-in only
        $salesQ = Sale::query()
            ->whereNull('customer_id')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->when($from, fn($q) => $q->where('created_at', '>=', $from.' 00:00:00'))
            ->when($to, fn($q) => $q->where('created_at', '<=', $to.' 23:59:59'));

        $summary = [
            'count' => (clone $salesQ)->count(),
            'total_sales' => (float) (clone $salesQ)->sum('total'),
            'total_paid' => (float) (clone $salesQ)->sum('amount_paid'),
        ];
        $summary['outstanding'] = max(0.0, round($summary['total_sales'] - $summary['total_paid'], 2));

        // Build transactions (ledger-style) and running balance
        $sales = (clone $salesQ)->orderBy('created_at')->get(['id','total','amount_paid','created_at','note']);
        $transactions = [];
        $running = 0.0;
        foreach ($sales as $s) {
            // Debit: full sale total increases balance
            $running = round($running + (float)$s->total, 2);
            $transactions[] = [
                'date' => optional($s->created_at)->toDateTimeString(),
                'type' => 'sale',
                'ref' => $s->id,
                'description' => 'Sale #'.$s->id.($s->note ? (' — '.$s->note) : ''),
                'debit' => (float)$s->total,
                'credit' => 0.0,
                'balance' => $running,
            ];
            // Credit: amount paid reduces balance
            if ((float)$s->amount_paid > 0) {
                $running = round($running - (float)$s->amount_paid, 2);
                $transactions[] = [
                    'date' => optional($s->created_at)->toDateTimeString(),
                    'type' => 'payment',
                    'ref' => $s->id,
                    'description' => 'Payment on Sale #'.$s->id.($s->note ? (' — '.$s->note) : ''),
                    'debit' => 0.0,
                    'credit' => (float)$s->amount_paid,
                    'balance' => $running,
                ];
            }
        }

        // Top products (by revenue and qty)
        $itemsQ = SaleItem::query()
            ->select('sale_items.product_id', DB::raw('SUM(sale_items.quantity) as qty_sum'), DB::raw('SUM(sale_items.total) as total_sum'))
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('sales.user_id', $user->id))
            ->whereNull('sales.customer_id')
            ->when($from, fn($q) => $q->where('sales.created_at', '>=', $from.' 00:00:00'))
            ->when($to, fn($q) => $q->where('sales.created_at', '<=', $to.' 23:59:59'))
            ->groupBy('sale_items.product_id');

        $topProducts = (clone $itemsQ)
            ->orderByDesc('total_sum')
            ->limit(10)
            ->get();
        $productNames = Product::whereIn('id', $topProducts->pluck('product_id')->filter()->unique()->values())->pluck('name','id');
        $topProducts = $topProducts->map(fn($r) => [
            'product_id' => $r->product_id,
            'name' => $r->product_id ? ($productNames[$r->product_id] ?? ('#'.$r->product_id)) : 'Unknown',
            'qty' => (int) $r->qty_sum,
            'total' => (float) $r->total_sum,
        ]);

        // Top categories (by revenue)
        $topCategories = SaleItem::query()
            ->select(DB::raw('COALESCE(products.category_id, 0) as category_id'), DB::raw('SUM(sale_items.total) as total_sum'))
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('sales.user_id', $user->id))
            ->whereNull('sales.customer_id')
            ->when($from, fn($q) => $q->where('sales.created_at', '>=', $from.' 00:00:00'))
            ->when($to, fn($q) => $q->where('sales.created_at', '<=', $to.' 23:59:59'))
            ->groupBy('category_id')
            ->orderByDesc('total_sum')
            ->limit(10)
            ->get();
        $categoryNames = \App\Models\Category::whereIn('id', $topCategories->pluck('category_id')->filter()->unique()->values())->pluck('name','id');
        $topCategories = $topCategories->map(fn($r) => [
            'category_id' => (int) $r->category_id,
            'name' => $r->category_id ? ($categoryNames[$r->category_id] ?? ('#'.$r->category_id)) : 'Uncategorized',
            'total' => (float) $r->total_sum,
        ]);

        return Inertia::render('WalkIn/Index', [
            'filters' => ['from' => $from, 'to' => $to],
            'summary' => $summary,
            'topProducts' => $topProducts,
            'topCategories' => $topCategories,
            'transactions' => $transactions,
        ]);
    }
}
