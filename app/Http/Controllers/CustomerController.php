<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Customer;
use App\Models\Shop;
use Illuminate\Support\Facades\Auth;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $customers = Customer::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->orderByDesc('id')->paginate(10)->withQueryString();
        return Inertia::render('Customers/Index', [
            'customers' => $customers,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Customers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:customers,email',
            'phone' => 'nullable|string|max:50',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $data['shop_id'] = session('shop_id') ?: optional(Shop::first())->id;
        $data['user_id'] = Auth::id();
        Customer::create($data);
        return redirect()->route('customers.index')->with('success', 'Customer created');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $customer = Customer::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        return Inertia::render('Customers/Show', [
            'customer' => $customer,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $customer = Customer::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $customer = Customer::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:customers,email,' . $customer->id,
            'phone' => 'nullable|string|max:50',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $data['shop_id'] = $customer->shop_id ?: (session('shop_id') ?: optional(Shop::first())->id);
        $customer->update($data);
        return redirect()->route('customers.index')->with('success', 'Customer updated');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $customer = Customer::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        $customer->delete();
        return redirect()->route('customers.index')->with('success', 'Customer deleted');
    }

    /**
     * Customer purchase history summary (including Walk-in customers)
     */
    public function history(\Illuminate\Http\Request $request)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $from = $request->input('from');
        $to = $request->input('to');

        // Sales grouped by customer
        $sales = \App\Models\Sale::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->when($from, fn($q) => $q->where('created_at', '>=', $from.' 00:00:00'))
            ->when($to, fn($q) => $q->where('created_at', '<=', $to.' 23:59:59'))
            ->selectRaw('COALESCE(customer_id, 0) as cid, COUNT(*) as cnt, SUM(total) as total_sum, MAX(created_at) as last_at')
            ->groupBy('cid')
            ->get()->keyBy('cid');

        // Receipts grouped by customer
        $receipts = \App\Models\CustomerReceipt::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when($from, fn($q) => $q->where('date', '>=', $from))
            ->when($to, fn($q) => $q->where('date', '<=', $to))
            ->selectRaw('customer_id as cid, SUM(amount) as paid_sum, MAX(date) as last_receipt')
            ->groupBy('cid')
            ->get()->keyBy('cid');

        $cids = array_unique(array_merge($sales->keys()->toArray(), $receipts->keys()->toArray()));
        // Exclude Walk-in (cid=0) from this page; it has a dedicated dashboard
        $cids = array_values(array_filter($cids, fn($cid) => intval($cid) !== 0));
        $custMap = Customer::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->whereIn('id', array_filter($cids))
            ->pluck('name','id');

        $rows = [];
        foreach ($cids as $cid) {
            $s = $sales[$cid] ?? null; $r = $receipts[$cid] ?? null;
            $name = $cid ? ($custMap[$cid] ?? ('#'.$cid)) : 'Walk-in Customer';
            $total = (float)($s->total_sum ?? 0);
            $paid = (float)($r->paid_sum ?? 0);
            $rows[] = [
                'customer_id' => $cid ? (int)$cid : null,
                'name' => $name,
                'sales_count' => (int)($s->cnt ?? 0),
                'total_sales' => $total,
                'total_receipts' => $paid,
                'outstanding' => max(0.0, round($total - $paid, 2)),
                'last_activity' => optional(($s->last_at ?? $r->last_receipt) ? \Carbon\Carbon::parse(($s->last_at ?? $r->last_receipt)) : null)->toDateTimeString(),
            ];
        }

        // Sort by outstanding desc then name
        usort($rows, function($a,$b){
            if ($b['outstanding'] == $a['outstanding']) { return strcmp($a['name'], $b['name']); }
            return $b['outstanding'] <=> $a['outstanding'];
        });

        return Inertia::render('Customers/History', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'rows' => $rows,
        ]);
    }

    /**
     * Detailed ledger for a specific customer (running balance)
     */
    public function ledger(string $id, \Illuminate\Http\Request $request)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $from = $request->input('from');
        $to = $request->input('to');

        $isWalkIn = intval($id) === 0;
        if ($isWalkIn) {
            $customer = [ 'id' => null, 'name' => 'Walk-in Customer' ];
        } else {
            $customer = Customer::when($shopId, fn($q)=>$q->where('shop_id',$shopId))
                ->when(!$isSuper, fn($q)=>$q->where('user_id', $user->id))
                ->findOrFail($id);
        }

        // Sales (increase receivable)
        $sales = \App\Models\Sale::query()
            ->when(!$isWalkIn, fn($q) => $q->where('customer_id', $customer['id'] ?? $customer->id))
            ->when($isWalkIn, fn($q) => $q->whereNull('customer_id'))
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->when($from, fn($q) => $q->where('created_at', '>=', $from.' 00:00:00'))
            ->when($to, fn($q) => $q->where('created_at', '<=', $to.' 23:59:59'))
            ->get(['id','total','created_at','amount_paid']);

        // Fetch sale items for drilldown (product, qty, rate)
        $saleIds = $sales->pluck('id')->all();
        $itemsBySale = [];
        if (!empty($saleIds)) {
            $saleItems = \App\Models\SaleItem::query()
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->whereIn('sale_id', $saleIds)
                ->get(['sale_id','product_id','quantity','sold_unit_price','total']);

            $productNames = \App\Models\Product::whereIn('id', $saleItems->pluck('product_id')->filter()->unique()->values())
                ->pluck('name','id');

            foreach ($saleItems as $si) {
                $itemsBySale[$si->sale_id] = $itemsBySale[$si->sale_id] ?? [];
                $itemsBySale[$si->sale_id][] = [
                    'product' => $si->product_id ? ($productNames[$si->product_id] ?? ('#'.$si->product_id)) : 'Unknown',
                    'quantity' => (int) $si->quantity,
                    'price' => (float) ($si->sold_unit_price ?? 0),
                    'total' => (float) $si->total,
                ];
            }
        }

        // Receipts (decrease receivable)
        $receipts = collect();
        if (!$isWalkIn) {
            $receipts = \App\Models\CustomerReceipt::query()
                ->where('customer_id', $customer->id)
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->when($from, fn($q) => $q->where('date', '>=', $from))
                ->when($to, fn($q) => $q->where('date', '<=', $to))
                ->get(['id','amount','date','payment_method']);
        }

        $events = [];
        foreach ($sales as $s) {
            $events[] = [
                'date' => optional($s->created_at)->toDateTimeString(),
                'type' => 'sale',
                'ref' => 'Sale #'.$s->id,
                'debit' => (float)$s->total,
                'credit' => 0.0,
                'items' => $itemsBySale[$s->id] ?? [],
            ];
            if ($isWalkIn) {
                $paid = (float)($s->amount_paid ?? 0);
                if ($paid > 0) {
                    $events[] = [
                        'date' => optional($s->created_at)->toDateTimeString(),
                        'type' => 'payment',
                        'ref' => 'Payment on Sale #'.$s->id,
                        'debit' => 0.0,
                        'credit' => min($paid, (float)$s->total),
                    ];
                }
            }
        }
        foreach ($receipts as $r) {
            $events[] = [
                'date' => \Carbon\Carbon::parse($r->date)->toDateString(),
                'type' => 'receipt',
                'ref' => 'Receipt #'.$r->id.' ('.$r->payment_method.')',
                'debit' => 0.0,
                'credit' => (float)$r->amount,
            ];
        }

        usort($events, fn($a,$b) => strcmp($a['date'], $b['date']));

        $running = 0.0; $totalDebit = 0.0; $totalCredit = 0.0;
        foreach ($events as &$e) {
            $running += ($e['debit'] - $e['credit']);
            $totalDebit += $e['debit'];
            $totalCredit += $e['credit'];
            $e['balance'] = round($running, 2);
        }
        unset($e);

        return Inertia::render('Customers/Ledger', [
            'customer' => $customer,
            'filters' => [ 'from' => $from, 'to' => $to ],
            'transactions' => $events,
            'totals' => [
                'debit' => round($totalDebit, 2),
                'credit' => round($totalCredit, 2),
                'balance' => round($running, 2),
            ],
        ]);
    }
}
