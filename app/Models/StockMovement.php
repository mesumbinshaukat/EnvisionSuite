<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\ShopScoped;

class StockMovement extends Model
{
    use HasFactory, ShopScoped;

    protected $fillable = [
        'shop_id','product_id','type','quantity_change','reference','notes','user_id'
    ];

    public function shop() { return $this->belongsTo(Shop::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
