<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id','product_id','type','quantity_change','reference','notes','user_id'
    ];

    public function shop() { return $this->belongsTo(Shop::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
