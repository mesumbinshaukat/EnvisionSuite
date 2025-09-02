<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;
use App\Models\Concerns\UserScoped;

class MoneyLoan extends Model
{
    use HasFactory, ShopScoped, UserScoped;

    protected $fillable = [
        'shop_id','counterparty_type','vendor_id','counterparty_name','direction','source','amount','date','note','user_id'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    public function vendor() { return $this->belongsTo(Vendor::class); }
    public function shop() { return $this->belongsTo(Shop::class); }
    public function user() { return $this->belongsTo(User::class); }
}
