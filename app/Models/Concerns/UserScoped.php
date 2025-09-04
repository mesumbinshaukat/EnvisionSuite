<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\App;

trait UserScoped
{
    /**
     * Apply the user scope automatically for all queries.
     */
    protected static function bootUserScoped(): void
    {
        static::addGlobalScope('user', function (Builder $query) {
            if (App::runningInConsole()) {
                return;
            }

            $user = Auth::user();
            if (!$user) {
                // No authenticated user -> block data
                $query->whereRaw('1 = 0');
                return;
            }

            // Enforce strict per-user data isolation for all roles

            if ($query->getModel()->isFillable('user_id')) {
                $query->where($query->getModel()->getTable() . '.user_id', $user->id);
            } else {
                // If model doesn't have user_id, model should define its own relation-based scope if needed.
                // We don't force anything here to avoid incorrect assumptions.
            }
        });

        static::creating(function ($model) {
            if (!App::runningInConsole()) {
                $user = Auth::user();
                if ($user && $model->isFillable('user_id') && empty($model->user_id)) {
                    $model->user_id = $user->id;
                }
            }
        });
    }

    /**
     * Remove the user scope for administrative or cross-user operations.
     */
    public static function withAllUsers(): Builder
    {
        return static::query()->withoutGlobalScope('user');
    }
}
