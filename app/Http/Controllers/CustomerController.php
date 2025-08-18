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
}
