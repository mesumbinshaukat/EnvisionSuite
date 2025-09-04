<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // Assets
            ['code' => '1000', 'name' => 'Cash in Hand', 'type' => 'asset'],
            ['code' => '1010', 'name' => 'Cash at Bank - Current Account', 'type' => 'asset'],
            ['code' => '1020', 'name' => 'Cash at Bank - Savings Account', 'type' => 'asset'],
            ['code' => '1100', 'name' => 'Accounts Receivable - Trade', 'type' => 'asset'],
            ['code' => '1110', 'name' => 'Accounts Receivable - Other', 'type' => 'asset'],
            ['code' => '1200', 'name' => 'Inventory - Finished Goods', 'type' => 'asset'],
            ['code' => '1210', 'name' => 'Inventory - Raw Materials', 'type' => 'asset'],
            ['code' => '1300', 'name' => 'Prepaid Expenses', 'type' => 'asset'],
            ['code' => '1400', 'name' => 'Fixed Assets - Equipment', 'type' => 'asset'],
            ['code' => '1410', 'name' => 'Fixed Assets - Furniture', 'type' => 'asset'],
            ['code' => '1500', 'name' => 'Accumulated Depreciation', 'type' => 'asset'],
            
            // Liabilities
            ['code' => '2000', 'name' => 'Sales Tax Payable', 'type' => 'liability'],
            ['code' => '2010', 'name' => 'Income Tax Payable', 'type' => 'liability'],
            ['code' => '2100', 'name' => 'Accounts Payable - Trade', 'type' => 'liability'],
            ['code' => '2110', 'name' => 'Accounts Payable - Other', 'type' => 'liability'],
            ['code' => '2200', 'name' => 'Accrued Expenses', 'type' => 'liability'],
            ['code' => '2300', 'name' => 'Short Term Loans', 'type' => 'liability'],
            ['code' => '2400', 'name' => 'Long Term Loans', 'type' => 'liability'],
            
            // Equity
            ['code' => '3000', 'name' => 'Owner Capital', 'type' => 'equity'],
            ['code' => '3100', 'name' => 'Retained Earnings', 'type' => 'equity'],
            ['code' => '3200', 'name' => 'Current Year Earnings', 'type' => 'equity'],
            
            // Revenue
            ['code' => '4000', 'name' => 'Sales Revenue - Products', 'type' => 'revenue'],
            ['code' => '4010', 'name' => 'Sales Revenue - Services', 'type' => 'revenue'],
            ['code' => '4100', 'name' => 'Other Income', 'type' => 'revenue'],
            ['code' => '4200', 'name' => 'Interest Income', 'type' => 'revenue'],
            ['code' => '4300', 'name' => 'Discount Received', 'type' => 'revenue'],
            
            // Expenses
            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense'],
            ['code' => '5100', 'name' => 'Salaries & Wages', 'type' => 'expense'],
            ['code' => '5200', 'name' => 'Rent Expense', 'type' => 'expense'],
            ['code' => '5300', 'name' => 'Utilities Expense', 'type' => 'expense'],
            ['code' => '5400', 'name' => 'Marketing & Advertising', 'type' => 'expense'],
            ['code' => '5500', 'name' => 'Office Supplies', 'type' => 'expense'],
            ['code' => '5600', 'name' => 'Insurance Expense', 'type' => 'expense'],
            ['code' => '5700', 'name' => 'Depreciation Expense', 'type' => 'expense'],
            ['code' => '5800', 'name' => 'Interest Expense', 'type' => 'expense'],
            ['code' => '5900', 'name' => 'Miscellaneous Expenses', 'type' => 'expense'],
        ];
        
        foreach ($accounts as $acc) {
            Account::firstOrCreate(['code' => $acc['code']], $acc);
        }
    }
}
