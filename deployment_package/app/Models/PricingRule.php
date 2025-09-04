<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;

class PricingRule extends Model
{
    use HasFactory, ShopScoped;

    protected $fillable = [
        'shop_id','product_id','cost_basis','fixed_cost','margin_type','margin_value',
        'scope_type','scope_qty','discount_type','discount_value','active','starts_at','ends_at','notes','created_by','updated_by'
    ];

    protected $casts = [
        'fixed_cost' => 'float',
        'margin_value' => 'float',
        'discount_value' => 'float',
        'active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function product() { return $this->belongsTo(Product::class); }
    public function shop() { return $this->belongsTo(Shop::class); }
}
