<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\App;

class JournalLine extends Model
{
    protected $fillable = ['journal_entry_id','account_id','debit','credit','memo'];

    public function entry(): BelongsTo { return $this->belongsTo(JournalEntry::class, 'journal_entry_id'); }
    public function account(): BelongsTo { return $this->belongsTo(Account::class); }

    /**
     * Inherit per-user filtering from the parent JournalEntry.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('user_via_entry', function ($query) {
            if (App::runningInConsole()) {
                return;
            }

            $user = Auth::user();
            if (!$user) {
                $query->whereRaw('1 = 0');
                return;
            }

            // Enforce strict per-user data isolation

            $query->whereHas('entry', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        });
    }
}
