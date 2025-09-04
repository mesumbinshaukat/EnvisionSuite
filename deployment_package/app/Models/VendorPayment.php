<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;
use App\Models\Concerns\UserScoped;

class VendorPayment extends Model
{
    use ShopScoped, UserScoped;

    protected $fillable = [
        'shop_id','user_id','vendor_id','date','amount','payment_method','notes','journal_entry_id'
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function vendor() { return $this->belongsTo(Vendor::class); }
    public function journalEntry() { return $this->belongsTo(JournalEntry::class, 'journal_entry_id'); }
}
