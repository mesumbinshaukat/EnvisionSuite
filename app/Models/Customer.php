<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Shop;
use App\Models\Sale;
use App\Models\Concerns\ShopScoped;

class Customer extends Model
{
    use ShopScoped;
    protected $fillable = [
        'name', 'email', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country', 'notes', 'is_active', 'shop_id', 'user_id'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
