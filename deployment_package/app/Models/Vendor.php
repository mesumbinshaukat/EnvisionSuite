<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;
use App\Models\Concerns\UserScoped;

class Vendor extends Model
{
    use HasFactory, ShopScoped, UserScoped;

    protected $fillable = [
        'name','email','phone','address','balance','shop_id','user_id'
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function shop() { return $this->belongsTo(Shop::class); }
    public function user() { return $this->belongsTo(User::class); }
}
