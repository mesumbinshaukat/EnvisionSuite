<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;
use App\Models\Concerns\UserScoped;

class Category extends Model
{
    use HasFactory, ShopScoped, UserScoped;

    protected $fillable = [
        'name', 'type', 'description', 'shop_id', 'user_id'
    ];

    public function shop() { return $this->belongsTo(Shop::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function products() { return $this->hasMany(Product::class); }
}
