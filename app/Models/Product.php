<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;

class Product extends Model
{
    use ShopScoped;
    protected $fillable = [
        'name', 'sku', 'description', 'price', 'stock', 'tax_rate', 'is_active', 'shop_id', 'user_id', 'category_id'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
