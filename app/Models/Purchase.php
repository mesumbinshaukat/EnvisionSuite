<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id','vendor_id','vendor_name','vendor_email','vendor_phone',
        'subtotal','tax_total','other_charges','grand_total',
        'amount_paid','payment_method','payment_details','notes','status','user_id'
    ];

    protected $casts = [
        'payment_details' => 'array',
        'subtotal' => 'float',
        'tax_total' => 'float',
        'other_charges' => 'float',
        'grand_total' => 'float',
        'amount_paid' => 'float',
    ];

    public function items() { return $this->hasMany(PurchaseItem::class); }
    public function vendor() { return $this->belongsTo(Vendor::class); }
}
