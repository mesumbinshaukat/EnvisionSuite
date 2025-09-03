<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Support\Facades\Auth;
use App\Models\PurchaseItem;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $products = Product::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->orderByDesc('id')->paginate(10)->withQueryString();

        // Compute metrics in bulk for the current page of product IDs
        $ids = collect($products->items())->pluck('id')->all();
        $avgPurchaseCost = collect();
        $avgSellingPrice = collect();
        $lastTwoPurchaseQty = collect();
        if (!empty($ids)) {
            // Average unit_cost from purchase_items
            $avgPurchaseCost = collect(DB::table('purchase_items')
                ->selectRaw('product_id, AVG(unit_cost) as avg_cost')
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->whereIn('product_id', $ids)
                ->groupBy('product_id')
                ->get())->keyBy('product_id');

            // Average selling price from sale_items (prefer sold_unit_price if present)
            $avgSellingPrice = collect(DB::table('sale_items')
                ->selectRaw('product_id, AVG(COALESCE(sold_unit_price, unit_price)) as avg_price')
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->whereIn('product_id', $ids)
                ->groupBy('product_id')
                ->get())->keyBy('product_id');

            // Last two purchase quantities per product
            $rows = DB::table('purchase_items')
                ->select('product_id', 'quantity', 'created_at')
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->whereIn('product_id', $ids)
                ->orderBy('product_id')
                ->orderByDesc('created_at')
                ->get();
            $grouped = [];
            foreach ($rows as $r) { $grouped[$r->product_id][] = $r; }
            foreach ($grouped as $pid => $list) {
                $newQty = isset($list[0]) ? (int) $list[0]->quantity : null;
                $oldQty = isset($list[1]) ? (int) $list[1]->quantity : null;
                $lastTwoPurchaseQty[$pid] = ['new' => $newQty, 'old' => $oldQty];
            }
        }

        // Attach computed fields to paginator items
        $products->getCollection()->transform(function ($p) use ($avgPurchaseCost, $avgSellingPrice, $lastTwoPurchaseQty) {
            $p->avg_purchase_cost = isset($avgPurchaseCost[$p->id]) ? round((float) $avgPurchaseCost[$p->id]->avg_cost, 2) : null;
            $p->avg_selling_price = isset($avgSellingPrice[$p->id]) ? round((float) $avgSellingPrice[$p->id]->avg_price, 2) : null;
            $p->last_purchase_new_qty = $lastTwoPurchaseQty[$p->id]['new'] ?? null;
            $p->last_purchase_old_qty = $lastTwoPurchaseQty[$p->id]['old'] ?? null;
            return $p;
        });

        return Inertia::render('Products/Index', [
            'products' => $products,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $categories = Category::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderBy('name')
            ->get(['id', 'name']);
        
        return Inertia::render('Products/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products,sku',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'category_id' => 'nullable|exists:categories,id',
        ]);
        
        // Handle empty tax_rate by setting it to 0
        if (empty($data['tax_rate'])) {
            $data['tax_rate'] = 0;
        }
        
        // Handle empty category_id by setting it to null
        if (empty($data['category_id'])) {
            $data['category_id'] = null;
        }
        
        // Handle empty description by setting it to null
        if (empty($data['description'])) {
            $data['description'] = null;
        }
        
        $data['shop_id'] = session('shop_id') ?: optional(Shop::first())->id;
        $data['user_id'] = Auth::id();
        Product::create($data);
        return redirect()->route('products.index')->with('success', 'Product created');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $product = Product::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $product = Product::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        return Inertia::render('Products/Edit', [
            'product' => $product,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $product = Product::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'category_id' => 'nullable|exists:categories,id',
        ]);
        
        // Handle empty category_id by setting it to null
        if (empty($data['category_id'])) {
            $data['category_id'] = null;
        }
        
        // Handle empty description by setting it to null
        if (empty($data['description'])) {
            $data['description'] = null;
        }
        
        $data['shop_id'] = $product->shop_id ?: (session('shop_id') ?: optional(Shop::first())->id);
        $product->update($data);
        return redirect()->route('products.index')->with('success', 'Product updated');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $product = Product::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        try {
            $product->delete();
            return redirect()->route('products.index')->with('success', 'Product deleted');
        } catch (\Illuminate\Database\QueryException $e) {
            // Likely foreign key constraint (referenced in sale_items/purchase_items)
            return redirect()->route('products.index')->with('error', 'Cannot delete this product because it is referenced by sales or purchases. Consider deactivating it instead.');
        }
    }
}
