<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Concerns\ShopScoped;

class Expense extends Model
{
    use ShopScoped;
    protected $fillable = [
        'shop_id','user_id','date','amount','payment_method','notes'
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function shop(): BelongsTo { return $this->belongsTo(Shop::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
