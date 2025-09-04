<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\App;

trait ShopScoped
{
    /**
     * Apply the shop scope automatically for all queries.
     */
    protected static function bootShopScoped(): void
    {
        static::addGlobalScope('shop', function (Builder $query) {
            // Do not scope when running in console (migrations, tinker, queues, etc.)
            if (App::runningInConsole()) {
                return;
            }

            $user = Auth::user();

            $shopId = session('shop_id');
            if ($shopId) {
                $query->where($query->getModel()->getTable() . '.shop_id', $shopId);
            } else {
                // If no shop in session for a web request, ensure no data leaks
                // by applying an impossible condition
                $query->whereRaw('1 = 0');
            }
        });

        // Ensure new records default to current shop if not provided
        static::creating(function ($model) {
            if (!App::runningInConsole()) {
                $shopId = session('shop_id');
                if ($shopId && empty($model->shop_id)) {
                    $model->shop_id = $shopId;
                }
            }
        });
    }

    /**
     * Manually constrain a query to a specific shop id (defaults to current).
     */
    public function scopeForCurrentShop(Builder $query, ?int $shopId = null): Builder
    {
        $shopId = $shopId ?? (int) session('shop_id');
        return $query->withoutGlobalScope('shop')
            ->where($query->getModel()->getTable() . '.shop_id', $shopId);
    }

    /**
     * Start a query without the shop scope (alias helper).
     */
    public static function withAllShops(): Builder
    {
        return static::query()->withoutGlobalScope('shop');
    }
}
