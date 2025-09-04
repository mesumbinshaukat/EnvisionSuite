<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ResetAndRichSeedSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tables = [
            // Core business tables
            'shops','categories','vendors','products','customers',
            'sales','sale_items','stock_movements','inventory_loans',
            'purchases','purchase_items','pricing_rules',
            // Accounting/ledger
            'accounts','bk_journal_entries','journal_lines',
            // Reports/aux
            'password_reset_tokens','cache','jobs','failed_jobs',
        ];

        foreach ($tables as $t) {
            try { DB::table($t)->truncate(); } catch (\Throwable $e) { /* ignore if not exists */ }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Now reseed everything via the main DatabaseSeeder
        $this->call(DatabaseSeeder::class);
    }
}
