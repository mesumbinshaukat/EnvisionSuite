<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\App;

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

    /**
     * Ensure items are filtered by the authenticated user's ownership via parent Purchase.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('user_via_purchase', function ($query) {
            if (App::runningInConsole()) {
                return;
            }

            $user = Auth::user();
            if (!$user) {
                $query->whereRaw('1 = 0');
                return;
            }

            if (method_exists($user, 'hasRole') && $user->hasRole('superadmin')) {
                return;
            }

            $query->whereHas('purchase', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        });
    }
}
