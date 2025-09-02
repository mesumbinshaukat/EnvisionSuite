<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Vendor;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;

class ProfitLossDemoSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();
        if (!$shop) { return; }

        // Guard: if we've already seeded our PL items, skip
        if (Product::where('sku', 'like', 'PL-%')->where('shop_id', $shop->id)->exists()) {
            return;
        }

        // Ensure a vendor exists
        $vendor = Vendor::firstOrCreate(
            ['shop_id' => $shop->id, 'name' => 'PL Seed Vendor'],
            ['email' => 'pl-vendor@example.com', 'phone' => '+1-555-0199']
        );

        // Create 3 targeted products with clear margins
        $products = [
            ['sku' => 'PL-PRO-ALPHA', 'name' => 'PL Alpha Gadget', 'price' => 3000.00, 'tax' => 0.00, 'stock' => 0],
            ['sku' => 'PL-PRO-BETA',  'name' => 'PL Beta Widget',  'price' => 1500.00, 'tax' => 0.00, 'stock' => 0],
            ['sku' => 'PL-PRO-GAMMA', 'name' => 'PL Gamma Consumable', 'price' => 500.00, 'tax' => 0.00, 'stock' => 0],
        ];
        $productIds = [];
        foreach ($products as $i => $p) {
            $prod = Product::firstOrCreate(
                ['sku' => $p['sku']],
                [
                    'name' => $p['name'],
                    'description' => $p['name'].' (P&L Demo)',
                    'price' => $p['price'],
                    'tax_rate' => $p['tax'],
                    'stock' => $p['stock'],
                    'is_active' => true,
                    'shop_id' => $shop->id,
                    'user_id' => ($i % 2) + 1,
                ]
            );
            $productIds[$p['sku']] = $prod->id;
        }

        // Customers: make one obvious Top Customer
        $customers = [
            ['name' => 'PL Top Customer', 'email' => 'pl.top.customer@example.com', 'phone' => '555-100-1000'],
            ['name' => 'PL Regular One',  'email' => 'pl.regular.one@example.com', 'phone' => '555-100-1001'],
            ['name' => 'PL Regular Two',  'email' => 'pl.regular.two@example.com', 'phone' => '555-100-1002'],
        ];
        $customerIds = [];
        foreach ($customers as $i => $c) {
            $cust = Customer::firstOrCreate(
                ['email' => $c['email']],
                [
                    'name' => $c['name'],
                    'phone' => $c['phone'],
                    'address_line1' => '100 Test Ave',
                    'city' => 'Metropolis',
                    'country' => 'PK',
                    'is_active' => true,
                    'shop_id' => $shop->id,
                    'user_id' => ($i % 2) + 1,
                ]
            );
            $customerIds[$c['email']] = $cust->id;
        }

        // Seed purchases over last 90 days to establish costs and inventory
        $now = Carbon::now();
        $productCostMap = [
            'PL-PRO-ALPHA' => 2000.00,  // margin ~1000 per unit
            'PL-PRO-BETA'  => 1000.00,  // margin ~500 per unit
            'PL-PRO-GAMMA' => 300.00,   // margin ~200 per unit
        ];
        for ($d = 89; $d >= 0; $d -= 7) { // weekly purchase batches
            $date = $now->copy()->subDays($d)->setTime(10, 15);
            $subtotal = 0; $items = [];
            foreach ($productCostMap as $sku => $cost) {
                $prodId = $productIds[$sku];
                $qty = 20; // keep it simple and sufficient for subsequent sales
                $line = round($qty * $cost, 2);
                $subtotal += $line;
                $items[] = [
                    'product_id' => $prodId,
                    'quantity' => $qty,
                    'unit_cost' => $cost,
                    'line_total' => $line,
                    'shop_id' => $shop->id,
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }
            $tax = 0.00; $other = 0.00; $grand = $subtotal + $tax + $other; $paid = $grand;
            $purchase = Purchase::create([
                'shop_id' => $shop->id,
                'user_id' => 1,
                'vendor_id' => $vendor->id,
                'vendor_name' => $vendor->name,
                'vendor_email' => $vendor->email,
                'vendor_phone' => $vendor->phone,
                'subtotal' => $subtotal,
                'tax_total' => $tax,
                'other_charges' => $other,
                'grand_total' => $grand,
                'amount_paid' => $paid,
                'payment_method' => 'bank',
                'status' => 'paid',
                'notes' => 'PL seeding batch',
                'created_at' => $date,
                'updated_at' => $date,
            ]);
            foreach ($items as $it) {
                $purchase->items()->create($it);
                // stock movement + increment stock count
                $prod = Product::lockForUpdate()->find($it['product_id']);
                if ($prod) {
                    if (!is_null($prod->stock)) { $prod->increment('stock', (int)$it['quantity']); }
                    StockMovement::create([
                        'shop_id' => $shop->id,
                        'product_id' => $prod->id,
                        'type' => 'adjustment',
                        'quantity_change' => (int)$it['quantity'],
                        'reference' => 'PL-SEED',
                        'notes' => 'PL seed purchase',
                        'user_id' => 1,
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]);
                }
            }
        }

        // Seed sales over 60 days to create clear trends and top lists
        for ($d = 59; $d >= 0; $d--) {
            $saleDate = $now->copy()->subDays($d)->setTime(rand(9, 18), rand(0, 59));

            // Daily: 1-3 sales. Top customer buys Alpha frequently.
            $salesToday = rand(1, 3);
            for ($s = 0; $s < $salesToday; $s++) {
                $isTopCustomer = ($s === 0) || (rand(0, 3) === 0); // bias towards top customer
                $customerId = $isTopCustomer ? $customerIds['pl.top.customer@example.com'] : [
                    $customerIds['pl.regular.one@example.com'],
                    $customerIds['pl.regular.two@example.com'],
                ][array_rand([0,1])];

                $lines = [];
                // Bias: include Alpha more often for top product and gross profit
                $skusPool = ['PL-PRO-ALPHA','PL-PRO-BETA','PL-PRO-GAMMA','PL-PRO-ALPHA'];
                $lineCount = rand(1, 3);
                $subtotal = 0; $tax = 0; $total = 0;
                for ($i = 0; $i < $lineCount; $i++) {
                    $sku = $skusPool[array_rand($skusPool)];
                    $prodId = $productIds[$sku];
                    $qty = rand(1, 3);
                    $sell = $products[array_search($sku, array_column($products, 'sku'))]['price'] ?? (
                        $sku === 'PL-PRO-ALPHA' ? 3000.00 : ($sku === 'PL-PRO-BETA' ? 1500.00 : 500.00)
                    );
                    $lineSub = round($sell * $qty, 2);
                    $lineTax = 0.00; // keep tax 0 for clarity in P&L demo
                    $lineTotal = $lineSub + $lineTax;
                    $subtotal += $lineSub; $tax += $lineTax; $total += $lineTotal;
                    $lines[] = [
                        'product_id' => $prodId,
                        'quantity' => $qty,
                        'unit_price' => $sell,
                        'original_unit_price' => $sell,
                        'sold_unit_price' => $sell,
                        'is_discounted' => false,
                        'margin_per_unit' => 0,
                        'margin_total' => 0,
                        'tax_amount' => $lineTax,
                        'total' => $lineTotal,
                        'shop_id' => $shop->id,
                        'created_at' => $saleDate,
                        'updated_at' => $saleDate,
                    ];

                    // decrement stock and movement
                    $prod = Product::find($prodId);
                    if ($prod && !is_null($prod->stock)) {
                        $prod->decrement('stock', $qty);
                    }
                    StockMovement::create([
                        'shop_id' => $shop->id,
                        'product_id' => $prodId,
                        'type' => 'sale',
                        'quantity_change' => -$qty,
                        'reference' => 'PL-SEED',
                        'notes' => 'PL seed sale',
                        'user_id' => 1,
                        'created_at' => $saleDate,
                        'updated_at' => $saleDate,
                    ]);
                }

                $sale = Sale::create([
                    'customer_id' => $customerId,
                    'status' => 'completed',
                    'subtotal' => $subtotal,
                    'discount' => 0,
                    'tax' => $tax,
                    'total' => $total,
                    'payment_method' => 'cash',
                    'reference' => (string) Str::uuid(),
                    'shop_id' => $shop->id,
                    'user_id' => 1,
                    'created_at' => $saleDate,
                    'updated_at' => $saleDate,
                ]);
                foreach ($lines as $li) { $sale->items()->create($li); }
            }
        }
    }
}
