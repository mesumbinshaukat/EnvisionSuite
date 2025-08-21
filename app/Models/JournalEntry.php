<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\ShopScoped;

class JournalEntry extends Model
{
    use ShopScoped;
    protected $table = 'bk_journal_entries';
    protected $fillable = ['date','memo','shop_id','user_id','reference_type','reference_id'];
    protected $casts = [
        'date' => 'date',
    ];

    public function lines(): HasMany { return $this->hasMany(JournalLine::class); }
}
