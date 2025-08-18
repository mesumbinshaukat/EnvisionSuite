<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    protected $fillable = ['code','name','type','parent_id','shop_id','user_id'];

    public function children(): HasMany { return $this->hasMany(Account::class, 'parent_id'); }
}
