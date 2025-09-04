<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use App\Models\Shop;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Roles
        $roles = ['superadmin','admin','cashier','accountant'];
        foreach ($roles as $r) { Role::findOrCreate($r); }

        // Default Super Admin (provided credentials)
        $admin = User::firstOrCreate(
            ['email' => 'muneeb.sadiq1285@gmail.com'],
            ['name' => 'Muneeb Sadiq', 'password' => Hash::make('admin123')]
        );
        if (!$admin->hasRole('superadmin')) { $admin->assignRole('superadmin'); }

        // Secondary default user to satisfy seed data that alternates user ownership
        $user2 = User::firstOrCreate(
            ['email' => 'demo.user2@example.com'],
            ['name' => 'Demo User 2', 'password' => Hash::make('password')]
        );
        if (!$user2->hasAnyRole(['admin','cashier','accountant','superadmin'])) {
            $user2->assignRole('admin');
        }

        // Default Shop (PKR currency for local deployment)
        $shop = Shop::firstOrCreate(['code' => 'MAIN'], [
            'name' => 'Main Shop',
            'currency' => 'PKR',
            'is_active' => true,
        ]);
        if ($shop->currency !== 'PKR') { $shop->currency = 'PKR'; $shop->save(); }

        // Unified demo data to populate journals, trial balance and all dashboard pages
        $this->call(DemoSeeder::class);

        // Richer test data for vendors, purchases (varied statuses), sales and vendor payoff
        $this->call(RichTestDataSeeder::class);
    }
}
