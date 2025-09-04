<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LedgerBootstrapSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure currency exists
        $usd = DB::table('ledger_currencies')->where('code', 'USD')->first();
        if (!$usd) {
            DB::table('ledger_currencies')->insert([
                'code' => 'USD',
                'decimals' => 2,
                'revision' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }

        // Domain
        $domain = DB::table('ledger_domains')->where('code', 'MAIN')->first();
        if (!$domain) {
            $domainUuid = (string) Str::uuid();
            DB::table('ledger_domains')->insert([
                'domainUuid' => $domainUuid,
                'code' => 'MAIN',
                'extra' => null,
                'flex' => null,
                'currencyDefault' => 'USD',
                'subJournals' => false,
                'revision' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $domain = (object) ['domainUuid' => $domainUuid, 'code' => 'MAIN'];
        }

        // Minimal accounts
        $accounts = [
            ['code' => '1000', 'name' => 'Cash', 'debit' => true, 'credit' => false, 'category' => false, 'closed' => false],
            ['code' => '4000', 'name' => 'Sales Revenue', 'debit' => false, 'credit' => true, 'category' => false, 'closed' => false],
        ];
        $accountUuids = [];
        foreach ($accounts as $acc) {
            $exists = DB::table('ledger_accounts')->where('code', $acc['code'])->first();
            if (!$exists) {
                $uuid = (string) Str::uuid();
                DB::table('ledger_accounts')->insert([
                    'ledgerUuid' => $uuid,
                    'code' => $acc['code'],
                    'taxCode' => null,
                    'parentUuid' => null,
                    'debit' => $acc['debit'],
                    'credit' => $acc['credit'],
                    'category' => $acc['category'],
                    'closed' => $acc['closed'],
                    'extra' => null,
                    'flex' => null,
                    'revision' => Carbon::now(),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                // Add names
                DB::table('ledger_names')->insert([
                    'ownerUuid' => $uuid,
                    'language' => 'en',
                    'name' => $acc['name'],
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
                $accountUuids[$acc['code']] = $uuid;
            } else {
                $accountUuids[$acc['code']] = $exists->ledgerUuid;
            }
        }

        // Seed a couple of balances so the /ledger page shows totals
        foreach ([
            ['code' => '1000', 'amount' => '1000.00'],
            ['code' => '4000', 'amount' => '-1000.00'], // credit balances are negative
        ] as $bal) {
            $exists = DB::table('ledger_balances')->where([
                'ledgerUuid' => $accountUuids[$bal['code']],
                'domainUuid' => $domain->domainUuid,
                'currency' => 'USD',
            ])->first();
            if (!$exists) {
                DB::table('ledger_balances')->insert([
                    'ledgerUuid' => $accountUuids[$bal['code']],
                    'domainUuid' => $domain->domainUuid,
                    'currency' => 'USD',
                    'balance' => $bal['amount'],
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }

        // Add a couple of recent journal entries so the list isn't empty
        for ($i = 1; $i <= 3; $i++) {
            $transDate = Carbon::now()->subDays($i);
            $entryId = DB::table('journal_entries')->insertGetId([
                'transDate' => $transDate,
                'domainUuid' => $domain->domainUuid,
                'subJournalUuid' => null,
                'currency' => 'USD',
                'opening' => 0,
                'clearing' => 0,
                'reviewed' => 1,
                'locked' => 0,
                'description' => 'Seeded entry #' . $i,
                'arguments' => json_encode([]),
                'language' => 'en',
                'extra' => null,
                'journalReferenceUuid' => null,
                'createdBy' => 'seeder',
                'updatedBy' => 'seeder',
                'revision' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // Details: debit cash, credit sales
            DB::table('journal_details')->insert([
                'journalEntryId' => $entryId,
                'ledgerUuid' => $accountUuids['1000'],
                'amount' => '100.00',
                'journalReferenceUuid' => null,
            ]);
            DB::table('journal_details')->insert([
                'journalEntryId' => $entryId,
                'ledgerUuid' => $accountUuids['4000'],
                'amount' => '-100.00',
                'journalReferenceUuid' => null,
            ]);
        }
    }
}
