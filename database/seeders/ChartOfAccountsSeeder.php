<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['code' => '1000', 'name' => 'Cash', 'type' => 'asset'],
            ['code' => '1100', 'name' => 'Accounts Receivable', 'type' => 'asset'],
            ['code' => '1200', 'name' => 'Inventory', 'type' => 'asset'],
            ['code' => '2000', 'name' => 'Tax Payable', 'type' => 'liability'],
            ['code' => '2100', 'name' => 'Accounts Payable', 'type' => 'liability'],
            ['code' => '3000', 'name' => 'Owner Equity', 'type' => 'equity'],
            ['code' => '4000', 'name' => 'Sales Revenue', 'type' => 'revenue'],
            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense'],
        ];
        foreach ($accounts as $acc) {
            Account::firstOrCreate(['code' => $acc['code']], $acc);
        }
    }
}
