<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Shop;
use App\Models\Concerns\ShopScoped;

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
}
