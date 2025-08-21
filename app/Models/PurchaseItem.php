<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;

class PurchaseItem extends Model
{
    use HasFactory, ShopScoped;

    protected $fillable = [
        'purchase_id','shop_id','product_id','quantity','unit_cost','line_total'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'float',
        'line_total' => 'float',
    ];

    public function purchase() { return $this->belongsTo(Purchase::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
