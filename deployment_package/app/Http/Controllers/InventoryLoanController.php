<?php

namespace App\Http\Controllers;

use App\Models\InventoryLoan;
use App\Models\Product;
use App\Models\Shop;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryLoanController extends Controller
{
    public function index()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $loans = InventoryLoan::with(['product','shop','counterpartyShop'])
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();
        return Inertia::render('InventoryLoans/Index', [ 'loans' => $loans ]);
    }

    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        return Inertia::render('InventoryLoans/Create', [
            'products' => Product::when($shopId, fn($q)=>$q->where('shop_id',$shopId))->where('is_active',true)->orderBy('name')->get(['id','name','sku','stock']),
            'shops' => Shop::orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'counterparty_type' => 'required|in:shop,external,customer,vendor',
            'counterparty_shop_id' => 'nullable|exists:shops,id',
            'counterparty_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        return DB::transaction(function () use ($data, $shopId) {
            // Lock product row and decrement stock
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);
            $qty = (int) $data['quantity'];
            if ($product->stock !== null) {
                $product->decrement('stock', $qty);
            }

            // Create loan record
            $loan = InventoryLoan::create([
                'shop_id' => $shopId,
                'product_id' => $product->id,
                'quantity' => $qty,
                'returned_quantity' => 0,
                'status' => 'lent',
                'counterparty_type' => $data['counterparty_type'],
                'counterparty_shop_id' => $data['counterparty_type'] === 'shop' ? ($data['counterparty_shop_id'] ?? null) : null,
                'counterparty_name' => $data['counterparty_type'] !== 'shop' ? ($data['counterparty_name'] ?? null) : null,
                'notes' => $data['notes'] ?? null,
                'user_id' => Auth::id(),
            ]);

            // Record stock movement: loan out as transfer_out
            if ($shopId) {
                StockMovement::create([
                    'shop_id' => $shopId,
                    'product_id' => $product->id,
                    'type' => 'transfer_out',
                    'quantity_change' => -$qty,
                    'reference' => 'LOAN-' . $loan->id,
                    'notes' => 'Inventory loan out',
                    'user_id' => Auth::id(),
                ]);
            }

            return redirect()->route('inventory.loans.index')->with('success', 'Inventory loan recorded.');
        });
    }
}
