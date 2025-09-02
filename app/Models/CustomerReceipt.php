<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\ShopScoped;
use App\Models\Concerns\UserScoped;

class CustomerReceipt extends Model
{
    use ShopScoped, UserScoped;

    protected $fillable = [
        'shop_id','user_id','customer_id','date','amount','payment_method','notes','journal_entry_id'
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function customer() { return $this->belongsTo(Customer::class); }
    public function journalEntry() { return $this->belongsTo(JournalEntry::class, 'journal_entry_id'); }
}
