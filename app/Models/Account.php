<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\ShopScoped;
use App\Models\Concerns\UserScoped;

class Account extends Model
{
    use ShopScoped, UserScoped;
    protected $fillable = ['code','name','type','parent_id','shop_id','user_id','is_closed'];

    public function children(): HasMany { return $this->hasMany(Account::class, 'parent_id'); }
}
