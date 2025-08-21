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
use App\Exports\PurchasesReportExport;
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

        $sales = Sale::with(['items','customer'])
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->orderByDesc('id')
            ->paginate(15)
            ->through(function($s){
                $units = (int) ($s->items?->sum('quantity') ?? 0);
                return [
                    'id' => $s->id,
                    'created_at' => optional($s->created_at)->toDateTimeString(),
                    'total' => (float) $s->total,
                    'status' => $s->status,
                    'payment_status' => $s->payment_status ?? null,
                    'amount_paid' => (float) ($s->amount_paid ?? 0),
                    'customer_name' => optional($s->customer)->name,
                    'customer_type' => $s->customer_id ? 'regular' : 'walk-in',
                    'items_count' => (int) ($s->items?->count() ?? 0),
                    'units_count' => $units,
                ];
            })
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

    public function purchasesExport(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $days = (int) $request->integer('days', 30);
        $days = $days > 0 && $days <= 180 ? $days : 30;
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();
        $vendorId = $request->input('vendor_id');
        $productId = $request->input('product_id');
        $status = $request->input('status');
        return Excel::download(new PurchasesReportExport($shopId, $startDate, $vendorId, $productId, $status), 'purchases_report.xlsx');
    }

    public function purchases(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        // Period selection (default: last 30 days for richer stats)
        $days = (int) $request->integer('days', 30);
        $days = $days > 0 && $days <= 180 ? $days : 30;
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();
        // Filters
        $vendorId = $request->input('vendor_id');
        $productId = $request->input('product_id');
        $status = $request->input('status');

        // Base queries
        $itemsQ = PurchaseItem::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when($productId, fn($q) => $q->where('product_id', $productId));
        $purchasesQ = Purchase::query()
            ->when($shopId, fn($q)=>$q->where('shop_id', $shopId))
            ->when($vendorId, fn($q) => $q->where('vendor_id', $vendorId))
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($productId, function($q) use ($productId) {
                $q->whereHas('items', fn($qq) => $qq->where('product_id', $productId));
            });

        // Totals and averages
        $periodItemsQ = (clone $itemsQ)->where('created_at', '>=', $startDate);
        $totalQty = (int) (clone $periodItemsQ)->sum('quantity');
        $weighted = (float) (clone $periodItemsQ)->selectRaw('SUM(quantity * unit_cost) as s')->value('s');
        $avgUnit = $totalQty > 0 ? round($weighted / $totalQty, 2) : 0.0;

        $periodPurchasesQ = (clone $purchasesQ)->where('created_at', '>=', $startDate);
        $totalSpend = (float) (clone $periodPurchasesQ)->sum('grand_total');
        $paid = (float) (clone $periodPurchasesQ)->sum('amount_paid');
        $outstanding = round(max(0.0, $totalSpend - $paid), 2);
        $avgDailySpend = $days > 0 ? round($totalSpend / $days, 2) : 0.0;
        $avgDailyQty = $days > 0 ? round($totalQty / $days, 2) : 0.0;

        // Spend per day (line chart)
        $spendRows = (clone $periodPurchasesQ)
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->selectRaw('DATE(created_at) as d, SUM(grand_total) as s')
            ->get()->keyBy('d');
        $qtyRows = (clone $periodItemsQ)
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->selectRaw('DATE(created_at) as d, SUM(quantity) as q')
            ->get()->keyBy('d');

        $labels = [];$spendSeries=[];$qtySeries=[];
        for ($i = 0; $i < $days; $i++) {
            $d = $startDate->copy()->addDays($i)->toDateString();
            $labels[] = $d;
            $spendSeries[] = isset($spendRows[$d]) ? (float) $spendRows[$d]->s : 0.0;
            $qtySeries[] = isset($qtyRows[$d]) ? (int) $qtyRows[$d]->q : 0;
        }

        // Vendor summary (totals and averages)
        $vendorSummary = PurchaseItem::query()
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->leftJoin('vendors', 'purchases.vendor_id', '=', 'vendors.id')
            ->when($shopId, fn($q) => $q->where('purchase_items.shop_id', $shopId))
            ->when($productId, fn($q) => $q->where('purchase_items.product_id', $productId))
            ->when($status, fn($q) => $q->where('purchases.status', $status))
            ->where('purchase_items.created_at', '>=', $startDate)
            ->groupBy('purchases.vendor_id')
            ->selectRaw('purchases.vendor_id, COALESCE(MAX(vendors.name), MAX(purchases.vendor_name)) as vendor_name, COUNT(DISTINCT purchases.id) as purchases_count, SUM(purchase_items.quantity) as total_qty, SUM(purchase_items.quantity * purchase_items.unit_cost) as total_spend, AVG(purchase_items.unit_cost) as avg_unit_cost')
            ->orderByDesc('total_spend')
            ->limit(25)
            ->get();

        // Product summary (top purchased products)
        $productSummary = PurchaseItem::query()
            ->leftJoin('products', 'purchase_items.product_id', '=', 'products.id')
            ->when($shopId, fn($q) => $q->where('purchase_items.shop_id', $shopId))
            ->when($vendorId, function($q) use ($vendorId) {
                $q->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                  ->where('purchases.vendor_id', $vendorId);
            })
            ->when($status, function($q) use ($status) {
                if (!str_contains($q->toSql(), 'join `purchases`')) {
                    $q->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id');
                }
                $q->where('purchases.status', $status);
            })
            ->where('purchase_items.created_at', '>=', $startDate)
            ->groupBy('purchase_items.product_id', 'products.name')
            ->selectRaw('purchase_items.product_id, COALESCE(products.name, CONCAT("#", purchase_items.product_id)) as product_name, SUM(purchase_items.quantity) as total_qty, SUM(purchase_items.quantity * purchase_items.unit_cost) as total_cost, AVG(purchase_items.unit_cost) as avg_unit_cost')
            ->orderByDesc('total_qty')
            ->limit(25)
            ->get();

        // Detailed purchases list (paginated)
        $detailedPurchases = Purchase::query()
            ->with(['vendor','items'])
            ->when($shopId, fn($q)=>$q->where('shop_id', $shopId))
            ->when($vendorId, fn($q) => $q->where('vendor_id', $vendorId))
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($productId, fn($q) => $q->whereHas('items', fn($qq) => $qq->where('product_id', $productId)))
            ->where('created_at', '>=', $startDate)
            ->orderByDesc('id')
            ->paginate(15)
            ->through(function($p){
                $units = (int) ($p->items->sum('quantity'));
                return [
                    'id' => $p->id,
                    'date' => optional($p->created_at)->toDateTimeString(),
                    'vendor' => $p->vendor->name ?? ($p->vendor_name ?? 'Unknown'),
                    'items' => (int) $p->items->count(),
                    'units' => $units,
                    'subtotal' => (float) $p->subtotal,
                    'tax_total' => (float) ($p->tax_total ?? 0),
                    'other_charges' => (float) ($p->other_charges ?? 0),
                    'grand_total' => (float) $p->grand_total,
                    'amount_paid' => (float) ($p->amount_paid ?? 0),
                    'status' => $p->status ?? null,
                ];
            })
            ->withQueryString();

        // Weekly and monthly averages over last 7/30 days
        $last7Start = Carbon::now()->subDays(6)->startOfDay();
        $last30Start = Carbon::now()->subDays(29)->startOfDay();
        $wSpend = (float) (clone $purchasesQ)->where('created_at','>=',$last7Start)->sum('grand_total');
        $mSpend = (float) (clone $purchasesQ)->where('created_at','>=',$last30Start)->sum('grand_total');
        $wQty = (int) (clone $itemsQ)->where('created_at','>=',$last7Start)->sum('quantity');
        $mQty = (int) (clone $itemsQ)->where('created_at','>=',$last30Start)->sum('quantity');

        // Dropdown options
        $vendorOptions = \App\Models\Vendor::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderBy('name')
            ->get(['id','name']);
        $productOptions = \App\Models\Product::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderBy('name')
            ->get(['id','name']);

        return Inertia::render('Reports/Purchases', [
            'filters' => [ 'days' => $days, 'vendor_id' => $vendorId, 'product_id' => $productId, 'status' => $status ],
            'aggregates' => [
                'totalQty' => $totalQty,
                'avgUnitCost' => $avgUnit,
                'totalSpend' => $totalSpend,
                'outstanding' => $outstanding,
                'avgDailySpend' => $avgDailySpend,
                'avgDailyQty' => $avgDailyQty,
                'weeklyAvgSpend' => round($wSpend / 7, 2),
                'monthlyAvgSpend' => round($mSpend / 30, 2),
                'weeklyAvgQty' => round($wQty / 7, 2),
                'monthlyAvgQty' => round($mQty / 30, 2),
            ],
            'chart' => [
                'labels' => $labels,
                'spend' => $spendSeries,
                'qty' => $qtySeries,
                'days' => $days,
            ],
            'vendorSummary' => $vendorSummary,
            'productSummary' => $productSummary,
            'purchases' => $detailedPurchases,
            'options' => [
                'vendors' => $vendorOptions,
                'products' => $productOptions,
                'statuses' => ['open','partial','paid']
            ],
        ]);
    }
}
