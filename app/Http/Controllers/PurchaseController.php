<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Vendor;
use App\Models\StockMovement;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $purchases = Purchase::with('vendor')
            ->when($shopId, fn($q)=>$q->where('shop_id', $shopId))
            ->latest()->paginate(15);
        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
        ]);
    }

    public function create(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $vendors = Vendor::when($shopId, fn($q)=>$q->where('shop_id', $shopId))->orderBy('name')->get(['id','name','email','phone']);
        $products = Product::when($shopId, fn($q)=>$q->where('shop_id', $shopId))->orderBy('name')->get(['id','name','sku','price']);
        return Inertia::render('Purchases/Create', [
            'vendors' => $vendors,
            'products' => $products,
            'flash' => session()->only(['vendorCreated']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => 'nullable|exists:vendors,id',
            'vendor_name' => 'nullable|string|max:255',
            'vendor_email' => 'nullable|email|max:255',
            'vendor_phone' => 'nullable|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.line_total' => 'nullable|numeric|min:0',
            'tax_percent' => 'nullable|numeric|min:0',
            'other_charges' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'payment_method' => 'nullable|string|max:50',
            'amount_paid' => 'nullable|numeric|min:0',
        ]);

        $user = $request->user();
        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        // Derive a reliable shop id from request items or fallback to first shop
        if (!$shopId) {
            $firstProductId = $data['items'][0]['product_id'] ?? null;
            $shopFromProduct = $firstProductId ? Product::where('id', $firstProductId)->value('shop_id') : null;
            $shopId = $shopFromProduct ?: Shop::value('id');
        }

        return DB::transaction(function() use ($data, $shopId, $user) {
            // Create vendor if not exists and name/email provided
            $vendorId = $data['vendor_id'] ?? null;
            $createdVendor = null;
            if (!$vendorId && (!empty($data['vendor_name']) || !empty($data['vendor_email']))) {
                $existing = null;
                if (!empty($data['vendor_email'])) {
                    $existing = Vendor::where('email', $data['vendor_email'])
                        ->when($shopId, fn($q)=>$q->where('shop_id', $shopId))
                        ->first();
                }
                if (!$existing && !empty($data['vendor_name'])) {
                    $existing = Vendor::where('name', $data['vendor_name'])
                        ->when($shopId, fn($q)=>$q->where('shop_id', $shopId))
                        ->first();
                }
                if ($existing) {
                    $vendorId = $existing->id;
                } else {
                    $createdVendor = Vendor::create([
                        'shop_id' => $shopId,
                        'name' => $data['vendor_name'] ?? 'New Vendor',
                        'email' => $data['vendor_email'] ?? null,
                        'phone' => $data['vendor_phone'] ?? null,
                    ]);
                    $vendorId = $createdVendor->id;
                }
            }

            // Prepare items
            $subtotal = 0.0;
            $itemsPrepared = [];
            foreach ($data['items'] as $line) {
                $qty = (int) $line['quantity'];
                $unit = isset($line['unit_cost']) ? (float) $line['unit_cost'] : null;
                $providedLineTotal = isset($line['line_total']) ? (float) $line['line_total'] : null;
                if ($providedLineTotal !== null && $qty > 0) {
                    // Derive unit from line total if given
                    $unit = round($providedLineTotal / $qty, 2);
                }
                if ($unit === null) { $unit = 0.0; }
                $lineTotal = $providedLineTotal !== null ? round($providedLineTotal, 2) : round($qty * $unit, 2);
                $subtotal += $lineTotal;
                $itemsPrepared[] = [
                    'shop_id' => $shopId,
                    'product_id' => $line['product_id'],
                    'quantity' => $qty,
                    'unit_cost' => $unit,
                    'line_total' => $lineTotal,
                ];
            }
            $taxPercent = isset($data['tax_percent']) ? (float)$data['tax_percent'] : 0.0;
            $taxTotal = round($subtotal * ($taxPercent/100.0), 2);
            $otherCharges = isset($data['other_charges']) ? (float)$data['other_charges'] : 0.0;
            $grand = round($subtotal + $taxTotal + $otherCharges, 2);
            $paid = isset($data['amount_paid']) ? (float)$data['amount_paid'] : 0.0;

            $purchase = Purchase::create([
                'shop_id' => $shopId,
                'user_id' => $user?->id,
                'vendor_id' => $vendorId,
                'vendor_name' => $data['vendor_name'] ?? null,
                'vendor_email' => $data['vendor_email'] ?? null,
                'vendor_phone' => $data['vendor_phone'] ?? null,
                'subtotal' => round($subtotal, 2),
                'tax_total' => $taxTotal,
                'other_charges' => $otherCharges,
                'grand_total' => $grand,
                'amount_paid' => $paid,
                'payment_method' => $data['payment_method'] ?? null,
                'payment_details' => null,
                'notes' => $data['notes'] ?? null,
                'status' => $paid >= $grand ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid'),
            ]);

            foreach ($itemsPrepared as $it) {
                $it['purchase_id'] = $purchase->id;
                PurchaseItem::create($it);

                // Increase stock and record stock movement if model exists
                $product = Product::lockForUpdate()->find($it['product_id']);
                if ($product) {
                    $product->stock = (int)($product->stock ?? 0) + (int)$it['quantity'];
                    $product->save();
                    if (class_exists(StockMovement::class)) {
                        StockMovement::create([
                            'shop_id' => $shopId,
                            'product_id' => $product->id,
                            'type' => 'adjustment',
                            'quantity_change' => (int) $it['quantity'],
                            'reference' => 'PUR-'.$purchase->id,
                            'notes' => 'Purchase #'.$purchase->id,
                            'user_id' => $user?->id,
                        ]);
                    }
                }
            }

            // TODO: Optionally create ledger journal entries mapping inventory/cash/AP
            // Skipped if ledger tables not ready, to avoid runtime errors.

            if ($createdVendor) {
                session()->flash('vendorCreated', [
                    'id' => $createdVendor->id,
                    'name' => $createdVendor->name,
                    'email' => $createdVendor->email,
                    'phone' => $createdVendor->phone,
                ]);
            }

            return redirect()->route('purchases.index');
        });
    }
}

