<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Services\LedgerService;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $isSuper = auth()->check() && method_exists(auth()->user(), 'hasRole') ? auth()->user()->hasRole('superadmin') : false;
        $query = Sale::with('customer');
        if ($shopId) { $query->where('shop_id', $shopId); }
        if (!$isSuper) { $query->where('user_id', auth()->id()); }
        $sales = $query->orderByDesc('id')->paginate(10)->withQueryString();
        return Inertia::render('Sales/Index', [
            'sales' => $sales,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $customers = Customer::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderBy('name')->get(['id','name']);
        $products = Product::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id','name','sku','price','tax_rate','stock']);
        return Inertia::render('Sales/Create', [
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'nullable|string|max:50', // cash, card, bank, mobile, wallet, credit
            'amount_paid' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:amount,percent',
            'discount_value' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($data) {
            $shopId = session('shop_id') ?: optional(Shop::first())->id; // current shop context
            $subtotal = 0; $taxTotal = 0; $discount = 0; $grand = 0;
            $itemsPrepared = [];

            // Aggregate requested quantities per product
            $requested = [];
            foreach ($data['items'] as $line) {
                $pid = (int) $line['product_id'];
                $requested[$pid] = ($requested[$pid] ?? 0) + (int) $line['quantity'];
            }
            // Load products with lock and validate stock
            $products = Product::whereIn('id', array_keys($requested))->lockForUpdate()->get(['id','name','stock','price','tax_rate']);
            foreach ($products as $prod) {
                $need = $requested[$prod->id] ?? 0;
                $available = (int) ($prod->stock ?? 0);
                if ($available < $need) {
                    abort(422, "Insufficient stock for {$prod->name}. Requested {$need}, available {$available}.");
                }
            }

            foreach ($data['items'] as $line) {
                $product = $products->firstWhere('id', (int)$line['product_id']);
                $qty = (int) $line['quantity'];
                $originalUnit = (float) $product->price; // MSRP / list price
                $soldUnit = isset($line['unit_price']) && $line['unit_price'] !== null ? (float)$line['unit_price'] : $originalUnit;
                $isDiscounted = $soldUnit < $originalUnit;
                $marginPerUnit = round($soldUnit - $originalUnit, 2); // variance from original price
                $marginTotal = round($marginPerUnit * $qty, 2);

                $unit = $soldUnit;
                $lineSub = $unit * $qty;
                $lineTax = round($lineSub * ((float)$product->tax_rate/100), 2);
                $lineTotal = $lineSub + $lineTax;

                // stock decrement
                if ($product && $product->stock !== null) {
                    $product->decrement('stock', $qty);
                }

                // Record stock movement
                if ($shopId) {
                    StockMovement::create([
                        'shop_id' => $shopId,
                        'product_id' => $product->id,
                        'type' => 'sale',
                        'quantity_change' => -$qty,
                        'reference' => null,
                        'notes' => 'POS sale deduction',
                        'user_id' => auth()->id(),
                    ]);
                }

                $subtotal += $lineSub;
                $taxTotal += $lineTax;
                $grand += $lineTotal;

                $itemsPrepared[] = [
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_price' => $unit,
                    'original_unit_price' => $originalUnit,
                    'sold_unit_price' => $soldUnit,
                    'is_discounted' => $isDiscounted,
                    'margin_per_unit' => $marginPerUnit,
                    'margin_total' => $marginTotal,
                    'tax_amount' => $lineTax,
                    'total' => $lineTotal,
                    'shop_id' => $shopId,
                ];
            }

            // Apply header discount (optional)
            $discountType = $data['discount_type'] ?? null;
            $discountValue = isset($data['discount_value']) ? (float)$data['discount_value'] : 0.0;
            if ($discountType === 'percent' && $discountValue > 0) {
                $discount = round($subtotal * min($discountValue, 100) / 100.0, 2);
            } elseif ($discountType === 'amount' && $discountValue > 0) {
                $discount = round(min($discountValue, $subtotal), 2);
            }

            $taxableBase = max(0.0, $subtotal - $discount);
            // Recalculate tax proportionally if discount applied (simple proportional approach)
            if ($discount > 0) {
                $taxTotal = round($taxTotal * ($taxableBase / max(0.01, $subtotal)), 2);
            }
            $grand = round($taxableBase + $taxTotal, 2);

            // Payments
            $amountPaid = isset($data['amount_paid']) ? (float)$data['amount_paid'] : 0.0;
            $amountPaid = max(0.0, min($amountPaid, $grand));
            $balance = round(max(0.0, $grand - $amountPaid), 2);
            $paymentStatus = $balance <= 0 ? 'paid' : ($amountPaid > 0 ? 'partial' : 'credit');

            $sale = Sale::create([
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => auth()->id(),
                'status' => 'completed',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $taxTotal,
                'total' => $grand,
                'amount_paid' => $amountPaid,
                'payment_method' => $data['payment_method'] ?? null,
                'payment_status' => $paymentStatus,
                'reference' => null,
                'shop_id' => $shopId,
            ]);

            foreach ($itemsPrepared as $it) {
                $sale->items()->create($it);
            }

            // Post to ledger (double-entry)
            app(LedgerService::class)->postSale($sale);

            return redirect()->route('sales.show', $sale->id)->with('success', 'Sale recorded');
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $sale = Sale::with(['items.product','customer'])->findOrFail($id);
        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        abort(404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        abort(404);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        abort(404);
    }
}
