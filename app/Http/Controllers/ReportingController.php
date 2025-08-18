<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Shop;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesReportExport;
use App\Exports\InventoryReportExport;
use Illuminate\Support\Facades\Auth;

class ReportingController extends Controller
{
    public function sales(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;

        $sales = Sale::with('items')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $total = (float) Sale::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->sum('total');

        // Aggregates: original vs discounted and average sold price (weighted by qty)
        $itemsQuery = \App\Models\SaleItem::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->whereHas('sale', function($q) use ($from, $to, $user, $isSuper) {
                $q->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
                  ->when(!$isSuper, fn($qq) => $qq->where('user_id', $user->id));
            });
        $totalQty = (int) (clone $itemsQuery)->sum('quantity');
        $weightedSum = (float) (clone $itemsQuery)->selectRaw('SUM(quantity * COALESCE(sold_unit_price, unit_price)) as s')->value('s') ?? 0.0;
        $avgSoldPrice = $totalQty > 0 ? round($weightedSum / $totalQty, 2) : 0.0;
        $originalUnits = (int) (clone $itemsQuery)->where(function($q){
            $q->where('is_discounted', false)->orWhereNull('is_discounted');
        })->sum('quantity');
        $discountedUnits = (int) (clone $itemsQuery)->where('is_discounted', true)->sum('quantity');

        $pricingStats = [
            'avg_sold_price' => $avgSoldPrice,
            'units_original_price' => $originalUnits,
            'units_discounted_price' => $discountedUnits,
            'total_units' => $totalQty,
        ];

        // Payment status aggregates
        $paymentAggregates = Sale::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->selectRaw('COALESCE(payment_status, "unknown") as status, COUNT(*) as cnt, SUM(total) as total_sum, SUM(COALESCE(amount_paid,0)) as paid_sum')
            ->groupBy(\DB::raw('COALESCE(payment_status, "unknown")'))
            ->get();

        // Discounts by customer: sum of line-level discount + header discount per customer
        $lineDiscByCustomer = SaleItem::query()
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('sales.user_id', $user->id))
            ->whereBetween('sales.created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->selectRaw('sales.customer_id as customer_id, SUM(sale_items.quantity * GREATEST(COALESCE(sale_items.original_unit_price, 0) - COALESCE(sale_items.sold_unit_price, sale_items.unit_price, 0), 0)) as line_discount')
            ->groupBy('sales.customer_id')
            ->pluck('line_discount', 'customer_id');

        $headerDiscByCustomer = Sale::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->selectRaw('customer_id, SUM(COALESCE(discount,0)) as d')
            ->groupBy('customer_id')
            ->pluck('d', 'customer_id');

        $customerNames = \App\Models\Customer::whereIn('id', array_filter(array_unique(array_merge(array_keys($lineDiscByCustomer->toArray()), array_keys($headerDiscByCustomer->toArray())))))
            ->pluck('name','id');
        $discountsByCustomer = [];
        foreach ($customerNames as $cid => $name) {
            $discountsByCustomer[] = [
                'customer_id' => $cid,
                'customer_name' => $name,
                'line_discount' => round((float)($lineDiscByCustomer[$cid] ?? 0), 2),
                'header_discount' => round((float)($headerDiscByCustomer[$cid] ?? 0), 2),
                'total_discount' => round((float)($lineDiscByCustomer[$cid] ?? 0) + (float)($headerDiscByCustomer[$cid] ?? 0), 2),
            ];
        }
        // sort by total_discount desc and limit top 10
        usort($discountsByCustomer, fn($a,$b)=>$b['total_discount'] <=> $a['total_discount']);
        $discountsByCustomer = array_slice($discountsByCustomer, 0, 10);

        // Discounts by product: line-level discount only (header discount not allocated to products)
        $discountsByProduct = SaleItem::query()
            ->when($shopId, fn($q) => $q->where('sale_items.shop_id', $shopId))
            ->whereHas('sale', function($q) use ($from, $to, $user, $isSuper) {
                $q->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
                  ->when(!$isSuper, fn($qq) => $qq->where('user_id', $user->id));
            })
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->selectRaw('sale_items.product_id, products.name as product_name, SUM(sale_items.quantity * GREATEST(COALESCE(sale_items.original_unit_price, 0) - COALESCE(sale_items.sold_unit_price, sale_items.unit_price, 0), 0)) as line_discount')
            ->groupBy('sale_items.product_id', 'products.name')
            ->orderByDesc('line_discount')
            ->limit(10)
            ->get();

        return Inertia::render('Reports/Sales', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'sales' => $sales,
            'total' => $total,
            'pricingStats' => $pricingStats,
            'paymentAggregates' => $paymentAggregates,
            'discountsByCustomer' => $discountsByCustomer,
            'discountsByProduct' => $discountsByProduct,
        ]);
    }

    public function salesExport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        return Excel::download(new SalesReportExport($from, $to, $shopId), 'sales_report.xlsx');
    }

    public function inventory(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $products = Product::withCount(['saleItems as sold_qty' => function($q) use ($shopId) {
                $q->when($shopId, fn($qq) => $qq->where('shop_id', $shopId));
            }])
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $movements = StockMovement::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('owner_user_id', $user->id))
            ->latest()->limit(20)->get();

        // Lent-out quantities by product
        $loanSums = \App\Models\InventoryLoan::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->selectRaw('product_id, SUM(GREATEST(quantity - returned_quantity, 0)) as lent_out')
            ->groupBy('product_id')
            ->pluck('lent_out','product_id');

        // Append computed fields to each product in paginator
        $products->getCollection()->transform(function($p) use ($loanSums) {
            $lent = (int) ($loanSums[$p->id] ?? 0);
            $p->lent_out = $lent;
            $p->in_shop = max(0, (int)($p->stock ?? 0) - $lent);
            return $p;
        });

        return Inertia::render('Reports/Inventory', [
            'products' => $products,
            'movements' => $movements,
        ]);
    }

    public function inventoryExport(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        return Excel::download(new InventoryReportExport($shopId), 'inventory_report.xlsx');
    }

    public function purchases(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $items = PurchaseItem::query()->when($shopId, fn($q) => $q->where('shop_id', $shopId));
        $totalQty = (int) (clone $items)->sum('quantity');
        $weighted = (float) (clone $items)->selectRaw('SUM(quantity * unit_cost) as s')->value('s');
        $avgUnit = $totalQty > 0 ? round($weighted / $totalQty, 2) : 0.0;

        $purchases = Purchase::when($shopId, fn($q)=>$q->where('shop_id', $shopId));
        $totalSpend = (float) (clone $purchases)->sum('grand_total');
        $paid = (float) (clone $purchases)->sum('amount_paid');
        $outstanding = round(max(0.0, $totalSpend - $paid), 2);

        // Build daily series for the last N days
        $days = (int) $request->integer('days', 14);
        $days = $days > 0 && $days <= 90 ? $days : 14;
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();

        // Spend per day from purchases
        $spendRows = (clone $purchases)
            ->where('created_at', '>=', $startDate)
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->selectRaw('DATE(created_at) as d, SUM(grand_total) as s')
            ->get()
            ->keyBy('d');

        // Quantity per day from purchase items
        $qtyRows = (clone $items)
            ->where('created_at', '>=', $startDate)
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->selectRaw('DATE(created_at) as d, SUM(quantity) as q')
            ->get()
            ->keyBy('d');

        $labels = [];
        $spendSeries = [];
        $qtySeries = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $startDate->copy()->addDays($i)->toDateString();
            $labels[] = $d;
            $spendSeries[] = isset($spendRows[$d]) ? (float) $spendRows[$d]->s : 0.0;
            $qtySeries[] = isset($qtyRows[$d]) ? (int) $qtyRows[$d]->q : 0;
        }

        return Inertia::render('Reports/Purchases', [
            'aggregates' => [
                'totalQty' => $totalQty,
                'avgUnitCost' => $avgUnit,
                'totalSpend' => $totalSpend,
                'outstanding' => $outstanding,
            ],
            'chart' => [
                'labels' => $labels,
                'spend' => $spendSeries,
                'qty' => $qtySeries,
                'days' => $days,
            ],
        ]);
    }
}
