<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Ensure superadmin role exists
        $roleId = DB::table('roles')->where('name', 'superadmin')->value('id');
        if (!$roleId) {
            $roleId = DB::table('roles')->insertGetId([
                'name' => 'superadmin',
                'guard_name' => 'web',
            ]);
        }
        $users = DB::table('users')->pluck('id');
        foreach ($users as $uid) {
            $exists = DB::table('model_has_roles')
                ->where('model_type', App\Models\User::class)
                ->where('model_id', $uid)
                ->where('role_id', $roleId)
                ->exists();
            if (!$exists) {
                DB::table('model_has_roles')->insert([
                    'role_id' => $roleId,
                    'model_type' => App\Models\User::class,
                    'model_id' => $uid,
                ]);
            }
        }
        // Optionally remove other roles assignments
        DB::table('model_has_roles')
            ->where('model_type', App\Models\User::class)
            ->whereNotIn('role_id', [$roleId])
            ->delete();
    }

    public function down(): void
    {
        // No-op: keeping users as superadmin
    }
};
