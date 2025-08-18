<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Support\Facades\Auth;
use App\Models\PurchaseItem;

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
        $purchased = PurchaseItem::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->selectRaw('product_id, MAX(id) as last_id, SUM(quantity) as tot_qty, SUM(quantity*unit_cost) as tot_cost')
            ->groupBy('product_id')
            ->get();
        $products = Product::whereIn('id', $purchased->pluck('product_id'))
            ->orderBy('name')
            ->get(['id','name','sku','price','stock']);
        $lastCosts = PurchaseItem::whereIn('id', $purchased->pluck('last_id'))->pluck('unit_cost','product_id');
        $avgCosts = [];
        foreach ($purchased as $row) {
            $avgCosts[$row->product_id] = $row->tot_qty > 0 ? ($row->tot_cost / $row->tot_qty) : 0;
        }
        $list = [];
        foreach ($products as $p) {
            $list[] = [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'last_cost' => (float)($lastCosts[$p->id] ?? 0),
                'avg_cost' => (float)($avgCosts[$p->id] ?? 0),
                'price' => (float)$p->price,
                'stock' => (int)($p->stock ?? 0),
            ];
        }
        return Inertia::render('Products/Create', [
            'purchasedProducts' => $list,
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
        $product->delete();
        return redirect()->route('products.index')->with('success', 'Product deleted');
    }
}
