<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Shop;
use Inertia\Inertia;

class ShareShopData
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $user = Auth::user();
            $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
            
            $shops = Shop::query()
                ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
                ->orderBy('name')
                ->get();
            
            $currentShopId = session('shop_id');
            $currentShop = null;
            
            if ($currentShopId) {
                $currentShop = $shops->where('id', $currentShopId)->first();
            }
            
            if (!$currentShop && $shops->isNotEmpty()) {
                $currentShop = $shops->first();
                session(['shop_id' => $currentShop->id]);
            }
            
            Inertia::share([
                'shops' => $shops,
                'currentShop' => $currentShop,
            ]);
        }
        
        return $next($request);
    }
}
