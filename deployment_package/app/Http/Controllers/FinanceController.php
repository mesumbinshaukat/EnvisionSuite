<?php
namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\VendorPayment;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class FinanceController extends Controller
{
    public function summary(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $from = $request->query('from');
        $to = $request->query('to');

        $ledger = app(LedgerService::class);
        $cash = $ledger->getAccountBalanceByCode('1000', $shopId);
        $bank = $ledger->getAccountBalanceByCode('1010', $shopId);

        $paymentsQ = VendorPayment::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when($from, fn($q) => $q->whereDate('date', '>=', $from))
            ->when($to, fn($q) => $q->whereDate('date', '<=', $to));

        $byMethod = (clone $paymentsQ)
            ->selectRaw('payment_method, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('payment_method')
            ->get()
            ->map(fn($r) => [
                'method' => $r->payment_method,
                'count' => (int) $r->count,
                'total' => (float) $r->total,
            ]);

        $totalPaid = (float) (clone $paymentsQ)->sum('amount');

        return Inertia::render('Finance/Summary', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'balances' => [ 'cash' => $cash, 'bank' => $bank, 'total' => round($cash + $bank, 2) ],
            'vendorPayments' => [ 'total' => $totalPaid, 'byMethod' => $byMethod ],
        ]);
    }

    public function equity(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $ledger = app(LedgerService::class);

        $cash = (float) $ledger->getAccountBalanceByCode('1000', $shopId);
        $bank = (float) $ledger->getAccountBalanceByCode('1010', $shopId);
        $inventory = (float) $ledger->getAccountBalanceByCode('1200', $shopId);
        $receivables = (float) $ledger->getAccountBalanceByCode('1100', $shopId);
        $payables = (float) $ledger->getAccountBalanceByCode('2100', $shopId);

        $assetsTotal = round($cash + $bank + $inventory + $receivables, 2);
        // present liabilities as positive balance even if stored as credit/negative
        $liabilitiesTotal = round(abs($payables), 2);
        $netWorth = round($assetsTotal - $liabilitiesTotal, 2);

        // Minimal sales velocity stats (last 30/90/365 days)
        $dailyAvg = 0; $weeklyAvg = 0; $monthlyAvg = 0;
        try {
            $start30 = now()->subDays(29)->startOfDay();
            $start90 = now()->subDays(89)->startOfDay();
            $start365 = now()->subDays(364)->startOfDay();

            // Average of per-day totals over last 30 days
            $dailyAvg = (float) DB::query()
                ->fromSub(function($q) use ($shopId, $start30) {
                    $q->from('sales')
                        ->selectRaw('DATE(created_at) as d, SUM(total) as daily_total')
                        ->where('shop_id', $shopId)
                        ->where('created_at', '>=', $start30)
                        ->groupBy('d');
                }, 't')
                ->avg('daily_total') ?? 0.0;

            // Average of per-week totals (last ~13 weeks)
            $weeklyAvg = (float) DB::query()
                ->fromSub(function($q) use ($shopId, $start90) {
                    $q->from('sales')
                        ->selectRaw('YEARWEEK(created_at) as w, SUM(total) as weekly_total')
                        ->where('shop_id', $shopId)
                        ->where('created_at', '>=', $start90)
                        ->groupBy('w');
                }, 't')
                ->avg('weekly_total') ?? 0.0;

            // Average of per-month totals (last 12 months)
            $monthlyAvg = (float) DB::query()
                ->fromSub(function($q) use ($shopId, $start365) {
                    $q->from('sales')
                        ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as m, SUM(total) as month_total')
                        ->where('shop_id', $shopId)
                        ->where('created_at', '>=', $start365)
                        ->groupBy('m');
                }, 't')
                ->avg('month_total') ?? 0.0;
        } catch (\Throwable $e) {
            // swallow; leave zeros when no sales table/data
        }

        // Price insights: price increase trend (month-over-month) and vendor price comparison (last 60 days)
        $priceIncreases = [];
        $vendorComparisons = null; // paginator
        try {
            $start6m = now()->subMonths(6)->startOfMonth();
            $rows = DB::table('purchase_items')
                ->when($shopId, fn($q) => $q->where('purchase_items.shop_id', $shopId))
                ->selectRaw('product_id, DATE_FORMAT(created_at, "%Y-%m") as ym, AVG(unit_cost) as avg_cost')
                ->where('created_at', '>=', $start6m)
                ->groupBy('product_id', 'ym')
                ->orderBy('product_id')
                ->orderBy('ym', 'desc')
                ->get();
            $byProduct = [];
            foreach ($rows as $r) { $byProduct[$r->product_id][] = $r; }
            $productNames = DB::table('products')->pluck('name','id');
            foreach ($byProduct as $pid => $list) {
                if (count($list) < 2) continue;
                $latest = (float) $list[0]->avg_cost;
                $prev = (float) $list[1]->avg_cost;
                if ($prev > 0) {
                    $pct = round((($latest - $prev) / $prev) * 100, 2);
                    if (!is_nan($pct)) {
                        $priceIncreases[] = [
                            'product_id' => (int) $pid,
                            'product_name' => $productNames[$pid] ?? ('#'.$pid),
                            'change_pct' => $pct,
                        ];
                    }
                }
            }
            // sort desc and take top 10
            usort($priceIncreases, fn($a,$b) => $b['change_pct'] <=> $a['change_pct']);
            $priceIncreases = array_slice($priceIncreases, 0, 10);

            // Vendor comparisons (avg unit cost by product/vendor in last 60 days) with pagination
            $start60 = now()->subDays(60)->startOfDay();
            $vendorPerPage = (int) max(5, (int) $request->query('vendor_per_page', 15));
            $vendorPage = (int) max(1, (int) $request->query('vendor_page', 1));
            $vendorComparisons = DB::table('purchase_items')
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->leftJoin('vendors', 'purchases.vendor_id', '=', 'vendors.id')
                ->leftJoin('products', 'purchase_items.product_id', '=', 'products.id')
                ->when($shopId, fn($q) => $q->where('purchase_items.shop_id', $shopId))
                ->where('purchase_items.created_at', '>=', $start60)
                ->groupBy('purchase_items.product_id', 'purchases.vendor_id', 'vendors.name', 'products.name')
                ->selectRaw('purchase_items.product_id, COALESCE(products.name, CONCAT("#", purchase_items.product_id)) as product_name, purchases.vendor_id, COALESCE(vendors.name, "Unknown") as vendor_name, AVG(purchase_items.unit_cost) as avg_cost')
                ->orderBy('product_name')
                ->orderBy('vendor_name')
                ->paginate($vendorPerPage, ['*'], 'vendor_page', $vendorPage)
                ->through(fn($r) => [
                    'product_id' => (int) $r->product_id,
                    'product_name' => $r->product_name,
                    'vendor_id' => (int) ($r->vendor_id ?? 0),
                    'vendor_name' => $r->vendor_name,
                    'avg_cost' => round((float) $r->avg_cost, 2),
                ]);
        } catch (\Throwable $e) {
            // ignore; leave empty if tables not present
        }

        // Probability of higher sales per product (share of last 30 days where daily qty > product's 30-day avg)
        $topProducts = [];
        try {
            $start30Days = now()->subDays(29)->startOfDay();
            $daily = DB::table('sale_items')
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->where('created_at', '>=', $start30Days)
                ->selectRaw('product_id, DATE(created_at) as d, SUM(quantity) as q')
                ->groupBy('product_id', 'd')
                ->get();
            $grouped = [];
            foreach ($daily as $r) { $grouped[$r->product_id][] = $r; }
            $productNames2 = DB::table('products')->pluck('name','id');
            foreach ($grouped as $pid => $rows2) {
                $days = count($rows2);
                if ($days < 5) continue;
                $sum = 0; foreach ($rows2 as $rr) { $sum += (int) $rr->q; }
                $avg = $days > 0 ? $sum / $days : 0;
                if ($avg <= 0) continue;
                $highDays = 0; foreach ($rows2 as $rr) { if ((int)$rr->q > $avg) { $highDays++; } }
                $prob = round(($highDays / $days) * 100, 2);
                $topProducts[] = [
                    'product_id' => (int) $pid,
                    'product_name' => $productNames2[$pid] ?? ('#'.$pid),
                    'probability' => $prob,
                ];
            }
            usort($topProducts, fn($a,$b) => $b['probability'] <=> $a['probability']);
            // paginate in-memory
            $prodPerPage = (int) max(5, (int) $request->query('products_per_page', 15));
            $prodPage = (int) max(1, (int) $request->query('products_page', 1));
            $topProducts = new LengthAwarePaginator(
                array_values(collect($topProducts)->forPage($prodPage, $prodPerPage)->toArray()),
                count($topProducts),
                $prodPerPage,
                $prodPage,
                ['path' => url()->current(), 'pageName' => 'products_page']
            );
        } catch (\Throwable $e) {
            // ignore
        }

        // Paginate price increases in-memory
        $incPerPage = (int) max(5, (int) $request->query('increases_per_page', 15));
        $incPage = (int) max(1, (int) $request->query('increases_page', 1));
        $priceIncreasesPaginator = new LengthAwarePaginator(
            array_values(collect($priceIncreases)->forPage($incPage, $incPerPage)->toArray()),
            count($priceIncreases),
            $incPerPage,
            $incPage,
            ['path' => url()->current(), 'pageName' => 'increases_page']
        );

        return Inertia::render('Finance/Equity', [
            'balances' => compact('cash','bank','inventory','receivables','payables','assetsTotal','liabilitiesTotal','netWorth'),
            'salesAverages' => [ 'daily' => round($dailyAvg,2), 'weekly' => round($weeklyAvg,2), 'monthly' => round($monthlyAvg,2) ],
            'priceInsights' => [ 'increases' => $priceIncreasesPaginator, 'vendorComparisons' => $vendorComparisons ],
            'probabilities' => [ 'topProducts' => $topProducts ],
        ]);
    }
}
