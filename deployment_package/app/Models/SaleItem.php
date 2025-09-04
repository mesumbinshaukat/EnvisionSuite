<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Shop;
use App\Models\Concerns\ShopScoped;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\App;

class SaleItem extends Model
{
    use ShopScoped;
    protected $fillable = [
        'sale_id','product_id','quantity','unit_price','tax_amount','total','shop_id',
        'original_unit_price','sold_unit_price','is_discounted','margin_per_unit','margin_total'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'original_unit_price' => 'decimal:2',
        'sold_unit_price' => 'decimal:2',
        'margin_per_unit' => 'decimal:2',
        'margin_total' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'is_discounted' => 'boolean',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Ensure items are also filtered by the authenticated user's ownership via parent Sale.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('user_via_sale', function ($query) {
            if (App::runningInConsole()) {
                return;
            }

            $user = Auth::user();
            if (!$user) {
                $query->whereRaw('1 = 0');
                return;
            }

            if (method_exists($user, 'hasRole') && $user->hasRole('superadmin')) {
                return;
            }

            $query->whereHas('sale', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        });
    }
}
