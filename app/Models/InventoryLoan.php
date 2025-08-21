<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;

class InventoryLoan extends Model
{
    use ShopScoped;
    protected $fillable = [
        'shop_id','product_id','quantity','returned_quantity','status',
        'counterparty_type','counterparty_name','counterparty_shop_id','notes','user_id'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'returned_quantity' => 'integer',
    ];

    public function shop() { return $this->belongsTo(Shop::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function counterpartyShop() { return $this->belongsTo(Shop::class, 'counterparty_shop_id'); }
    public function user() { return $this->belongsTo(User::class); }

    public function getOutstandingAttribute() {
        return max(0, (int)$this->quantity - (int)$this->returned_quantity);
    }
}
