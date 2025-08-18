<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VendorController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $vendors = Vendor::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();
        return Inertia::render('Vendors/Index', [ 'vendors' => $vendors ]);
    }

    public function create()
    {
        return Inertia::render('Vendors/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'email' => ['nullable','email','max:255'],
            'phone' => ['nullable','string','max:50'],
            'address' => ['nullable','string','max:255'],
            'balance' => ['nullable','numeric'],
        ]);
        $data['shop_id'] = session('shop_id') ?: optional(Shop::first())->id;
        $data['user_id'] = Auth::id();
        Vendor::create($data);
        return redirect()->route('vendors.index')->with('success', 'Vendor created');
    }

    public function edit(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $vendor = Vendor::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        return Inertia::render('Vendors/Edit', [ 'vendor' => $vendor ]);
    }

    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $vendor = Vendor::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'email' => ['nullable','email','max:255'],
            'phone' => ['nullable','string','max:50'],
            'address' => ['nullable','string','max:255'],
            'balance' => ['nullable','numeric'],
        ]);
        $data['shop_id'] = $vendor->shop_id ?: (session('shop_id') ?: optional(Shop::first())->id);
        $vendor->update($data);
        return redirect()->route('vendors.index')->with('success', 'Vendor updated');
    }

    public function destroy(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $vendor = Vendor::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        $vendor->delete();
        return redirect()->route('vendors.index')->with('success', 'Vendor deleted');
    }
}
