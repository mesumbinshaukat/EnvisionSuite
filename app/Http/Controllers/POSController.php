<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;

class POSController extends Controller
{
    public function index()
    {
        return Inertia::render('POS/Index', [
            'customers' => Customer::orderBy('name')->get(['id','name']),
            'products' => Product::where('is_active', true)->orderBy('name')->get(['id','name','sku','price','tax_rate','stock']),
        ]);
    }

    public function checkout(Request $request)
    {
        $data = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'nullable|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return app(SaleController::class)->store($request);
    }
}
