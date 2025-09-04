<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Shop;
use Inertia\Inertia;

class SetCurrentShop
{
    public function handle(Request $request, Closure $next): Response
    {
        $shopId = session('shop_id');
        if (!$shopId) {
            $shopId = optional(Shop::first())->id;
            if ($shopId) {
                session(['shop_id' => $shopId]);
            }
        }
        $currentShop = $shopId ? Shop::find($shopId) : null;
        Inertia::share('currentShop', $currentShop);
        return $next($request);
    }
}
