<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;

class StockMovementController extends Controller
{
    public function index()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $movements = StockMovement::with('product')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();
        return Inertia::render('Inventory/Adjustments/Index', [
            'movements' => $movements,
        ]);
    }

    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $products = Product::when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderBy('name')
            ->get(['id','name','sku']);
        return Inertia::render('Inventory/Adjustments/Create', [
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:adjustment,transfer_in,transfer_out,return',
            'quantity_change' => 'required|integer',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        return DB::transaction(function () use ($data, $shopId) {
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);
            $movement = StockMovement::create([
                'shop_id' => $shopId,
                'product_id' => $data['product_id'],
                'type' => $data['type'],
                'quantity_change' => $data['quantity_change'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'user_id' => auth()->id(),
                'owner_user_id' => $product->user_id ?: auth()->id(),
            ]);

            // Update on-hand stock
            if (!is_null($product->stock)) {
                $product->increment('stock', $data['quantity_change']);
            }

            return redirect()->route('inventory.adjustments.index')->with('success', 'Stock adjusted.');
        });
    }
}
