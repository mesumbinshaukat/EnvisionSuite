<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\Shop;
use App\Models\PricingRule;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PricingController extends Controller
{
    public function index()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $rules = PricingRule::with('product:id,name,sku')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->latest('id')
            ->paginate(20);
        return Inertia::render('Products/PricingIndex', [
            'rules' => $rules,
        ]);
    }
    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        // Purchased products list with last and average costs
        $purchased = PurchaseItem::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->selectRaw('product_id, MAX(id) as last_id, SUM(quantity) as tot_qty, SUM(quantity*unit_cost) as tot_cost')
            ->groupBy('product_id')
            ->get();
        $products = Product::whereIn('id', $purchased->pluck('product_id'))->get(['id','name','sku','price']);
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
            ];
        }
        return Inertia::render('Products/PricingCreate', [
            'purchasedProducts' => $list,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'cost_basis' => 'required|in:last,average,fixed',
            'fixed_cost' => 'nullable|numeric|min:0',
            'margin_type' => 'required|in:percent,amount',
            'margin_value' => 'required|numeric|min:0',
            'scope_type' => 'required|in:all_units,specific_qty',
            'scope_qty' => 'nullable|integer|min:1',
            'discount_type' => 'required|in:none,percent,amount',
            'discount_value' => 'nullable|numeric|min:0',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'notes' => 'nullable|string',
        ]);
        $data['shop_id'] = session('shop_id') ?: optional(Shop::first())->id;
        $data['created_by'] = auth()->id();
        $data['updated_by'] = auth()->id();
        $data['active'] = true;
        PricingRule::create($data);
        return redirect()->route('pricing.index')->with('success', 'Pricing rule saved');
    }

    public function compute(Request $request, PricingService $service)
    {
        $productId = (int) $request->query('product_id');
        if (!$productId) {
            return response()->json(['error' => 'product_id required'], 422);
        }
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $result = $service->computePrice($productId, $shopId);
        return response()->json($result);
    }

    public function edit(PricingRule $rule)
    {
        $rule->load('product:id,name,sku');
        return Inertia::render('Products/PricingEdit', [
            'rule' => $rule,
        ]);
    }

    public function update(Request $request, PricingRule $rule)
    {
        $data = $request->validate([
            'cost_basis' => 'required|in:last,average,fixed',
            'fixed_cost' => 'nullable|numeric|min:0',
            'margin_type' => 'required|in:percent,amount',
            'margin_value' => 'required|numeric|min:0',
            'scope_type' => 'required|in:all_units,specific_qty',
            'scope_qty' => 'nullable|integer|min:1',
            'discount_type' => 'required|in:none,percent,amount',
            'discount_value' => 'nullable|numeric|min:0',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'notes' => 'nullable|string',
            'active' => 'boolean',
        ]);
        $data['updated_by'] = auth()->id();
        $rule->update($data);
        return redirect()->route('pricing.index')->with('success', 'Pricing rule updated');
    }

    public function destroy(PricingRule $rule)
    {
        $rule->delete();
        return redirect()->route('pricing.index')->with('success', 'Pricing rule deleted');
    }
}
