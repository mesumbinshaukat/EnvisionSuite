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

        // Default Shop
        Shop::firstOrCreate(['code' => 'MAIN'], [
            'name' => 'Main Shop',
            'currency' => 'USD',
            'is_active' => true,
        ]);

        // Chart of Accounts
        $this->call(ChartOfAccountsSeeder::class);

        // Initialize Abivia Ledger package tables (domain, currency, accounts, sample entries)
        $this->call(LedgerBootstrapSeeder::class);

        // Sample data
        $this->call(SampleDataSeeder::class);
        
        // Comprehensive data
        $this->call(ComprehensiveDataSeeder::class);
    }
}
