<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Shop;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ShopController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shops = Shop::query()
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->orderBy('name')
            ->get();
        return Inertia::render('Shops/Index', [
            'shops' => $shops,
            'currentShopId' => session('shop_id'),
        ]);
    }

    public function switch(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shop = Shop::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        session(['shop_id' => $shop->id]);
        return redirect()->back()->with('success', 'Switched to shop: ' . $shop->name);
    }

    public function create()
    {
        return Inertia::render('Shops/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'location' => ['nullable','string','max:255'],
        ]);
        $shop = Shop::create([
            'name' => $data['name'],
            'location' => $data['location'] ?? null,
            'code' => Str::upper(Str::random(6)),
            'user_id' => Auth::id(),
        ]);
        session(['shop_id' => $shop->id]);
        return redirect()->route('shops.index')->with('success', 'Shop created.');
    }
}
