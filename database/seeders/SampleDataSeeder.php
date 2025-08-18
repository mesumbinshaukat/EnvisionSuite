<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Category;
use App\Models\InventoryLoan;
use App\Models\Vendor;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Carbon\Carbon;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();
        if (!$shop) {
            $shop = Shop::create(['name' => 'Main Shop', 'code' => 'MAIN', 'currency' => 'USD']);
        }

        // Categories
        if (Category::count() < 8) {
            $cats = ['Beverages','Snacks','Electronics','Stationery','Household','Personal Care','Dairy & Bakery','Cleaning Supplies'];
            foreach ($cats as $idx => $name) {
                Category::firstOrCreate(
                    ['name' => $name, 'shop_id' => $shop->id],
                    ['type' => $idx % 2 === 0 ? 'goods' : 'misc', 'description' => $name.' category', 'user_id' => null]
                );
            }
        }

        // Products (professional sample set)
        if (Product::count() < 20) {
            $productsSeed = [
                ['sku' => 'BEV-ESP-250', 'name' => 'Espresso Beans 250g', 'price' => 9.99, 'tax' => 5.00, 'stock' => 80],
                ['sku' => 'BEV-TEA-100', 'name' => 'Assorted Tea Bags (100)', 'price' => 7.49, 'tax' => 5.00, 'stock' => 120],
                ['sku' => 'SNK-CHP-200', 'name' => 'Sea Salt Potato Chips 200g', 'price' => 2.99, 'tax' => 5.00, 'stock' => 150],
                ['sku' => 'ELC-PWR-USB', 'name' => 'USB-C Power Adapter 20W', 'price' => 19.90, 'tax' => 5.00, 'stock' => 40],
                ['sku' => 'ELC-CBL-1M', 'name' => 'USB-C to USB-A Cable 1m', 'price' => 6.50, 'tax' => 5.00, 'stock' => 100],
                ['sku' => 'STA-NBK-A5', 'name' => 'A5 Lined Notebook', 'price' => 3.25, 'tax' => 5.00, 'stock' => 200],
                ['sku' => 'HSH-DTR-500', 'name' => 'Dish Detergent 500ml', 'price' => 2.85, 'tax' => 5.00, 'stock' => 90],
                ['sku' => 'PRC-SHP-250', 'name' => 'Shampoo 250ml', 'price' => 4.99, 'tax' => 5.00, 'stock' => 110],
                ['sku' => 'DRY-MLK-1L', 'name' => 'Organic Milk 1L', 'price' => 1.95, 'tax' => 0.00, 'stock' => 60],
                ['sku' => 'BKE-BRD-WHT', 'name' => 'White Bread Loaf', 'price' => 1.20, 'tax' => 0.00, 'stock' => 70],
            ];
            foreach ($productsSeed as $i => $row) {
                Product::firstOrCreate(
                    ['sku' => $row['sku']],
                    [
                        'name' => $row['name'],
                        'description' => $row['name'].' - seeded item',
                        'price' => $row['price'],
                        'stock' => $row['stock'],
                        'tax_rate' => $row['tax'],
                        'is_active' => true,
                        'shop_id' => $shop->id,
                    ]
                );
            }
        }

        // Customers (professional-looking)
        if (Customer::count() < 12) {
            $customersSeed = [
                ['name' => 'Ava Thompson', 'email' => 'ava.thompson@clientmail.com', 'phone' => '555-010-1010'],
                ['name' => 'Liam Patel', 'email' => 'liam.patel@clientmail.com', 'phone' => '555-010-2020'],
                ['name' => 'Noah Kim', 'email' => 'noah.kim@clientmail.com', 'phone' => '555-010-3030'],
                ['name' => 'Emma Rodriguez', 'email' => 'emma.rod@clientmail.com', 'phone' => '555-010-4040'],
                ['name' => 'Olivia Nguyen', 'email' => 'olivia.ng@clientmail.com', 'phone' => '555-010-5050'],
                ['name' => 'William Chen', 'email' => 'william.chen@clientmail.com', 'phone' => '555-010-6060'],
                ['name' => 'Sophia Brown', 'email' => 'sophia.brown@clientmail.com', 'phone' => '555-010-7070'],
                ['name' => 'James Anderson', 'email' => 'james.anderson@clientmail.com', 'phone' => '555-010-8080'],
            ];
            foreach ($customersSeed as $c) {
                Customer::firstOrCreate(
                    ['email' => $c['email']],
                    [
                        'name' => $c['name'],
                        'phone' => $c['phone'],
                        'address_line1' => 'Suite 200, 100 Market Street',
                        'city' => 'Metropolis',
                        'country' => 'US',
                        'is_active' => true,
                        'shop_id' => $shop->id,
                    ]
                );
            }
        }

        // Create a few sales with items and stock movements (with pricing fields)
        $products = Product::where('shop_id', $shop->id)->take(5)->get();
        $customers = Customer::where('shop_id', $shop->id)->take(5)->get();
        if ($products->count() && $customers->count() && Sale::count() < 12) {
            for ($s=1; $s<=8; $s++) {
                DB::transaction(function () use ($shop, $products, $customers) {
                    $subtotal = 0; $tax = 0; $total = 0; $itemsData = [];
                    $lines = $products->random(rand(1,3));
                    $saleDate = Carbon::now()->subDays(rand(0, 28))->setTime(rand(9,18), rand(0,59));
                    foreach ($lines as $p) {
                        $qty = rand(1,3);
                        $original = (float) $p->price;
                        // randomly discount ~50% of lines by 5-20%
                        $discountPct = (rand(0,1) === 1) ? rand(5,20) : 0;
                        $sold = $discountPct > 0 ? round($original * (1 - $discountPct/100), 2) : $original;
                        $isDiscounted = $sold < $original;
                        $marginPerUnit = round($sold - $original, 2);
                        $lineSub = $sold * $qty;
                        $lineTax = round($lineSub * 0.05, 2);
                        $lineTotal = $lineSub + $lineTax;
                        $subtotal += $lineSub; $tax += $lineTax; $total += $lineTotal;
                        $itemsData[] = [
                            'product_id' => $p->id,
                            'quantity' => $qty,
                            'unit_price' => $sold,
                            'original_unit_price' => $original,
                            'sold_unit_price' => $sold,
                            'is_discounted' => $isDiscounted,
                            'margin_per_unit' => $marginPerUnit,
                            'margin_total' => round($marginPerUnit * $qty, 2),
                            'tax_amount' => $lineTax,
                            'total' => $lineTotal,
                            'shop_id' => $shop->id,
                            'created_at' => $saleDate,
                            'updated_at' => $saleDate,
                        ];

                        // decrement stock and log movement
                        if (!is_null($p->stock)) {
                            $p->decrement('stock', $qty);
                        }
                        StockMovement::create([
                            'shop_id' => $shop->id,
                            'product_id' => $p->id,
                            'type' => 'sale',
                            'quantity_change' => -$qty,
                            'reference' => 'SEED',
                            'notes' => 'Seed sale movement',
                            'user_id' => null,
                            'created_at' => $saleDate,
                            'updated_at' => $saleDate,
                        ]);
                    }
                    $sale = Sale::create([
                        'customer_id' => $customers->random()->id,
                        'status' => 'completed',
                        'subtotal' => $subtotal,
                        'discount' => 0,
                        'tax' => $tax,
                        'total' => $total,
                        'payment_method' => 'cash',
                        'reference' => Str::uuid()->toString(),
                        'shop_id' => $shop->id,
                        'created_at' => $saleDate,
                        'updated_at' => $saleDate,
                    ]);
                    foreach ($itemsData as $it) { $sale->items()->create($it); }
                });
            }
        }

        // Inventory Loans
        if (InventoryLoan::count() < 3 && Product::whereNotNull('stock')->exists()) {
            $loanProducts = Product::where('shop_id', $shop->id)->where('stock','>',0)->take(3)->get();
            foreach ($loanProducts as $lp) {
                $qty = min(5, max(1, (int) ($lp->stock / 10)));
                $loanDate = Carbon::now()->subDays(rand(3, 20))->setTime(rand(9,17), rand(0,59));
                // decrement stock and create stock movement for loan
                if (!is_null($lp->stock)) { $lp->decrement('stock', $qty); }
                StockMovement::create([
                    'shop_id' => $shop->id,
                    'product_id' => $lp->id,
                    'type' => 'transfer_out',
                    'quantity_change' => -$qty,
                    'reference' => 'SEED',
                    'notes' => 'Seed inventory loan movement',
                    'user_id' => null,
                    'created_at' => $loanDate,
                    'updated_at' => $loanDate,
                ]);
                InventoryLoan::create([
                    'shop_id' => $shop->id,
                    'product_id' => $lp->id,
                    'quantity' => $qty,
                    'returned_quantity' => 0,
                    'status' => 'lent',
                    'counterparty_type' => 'shop',
                    'counterparty_shop_id' => $shop->id,
                    'notes' => 'Seed loan',
                    'user_id' => null,
                    'created_at' => $loanDate,
                    'updated_at' => $loanDate,
                ]);
            }
        }

        // Vendors (professional dataset)
        if (Vendor::count() < 8) {
            $vendorData = [
                ['name' => 'Acme Distributors', 'email' => 'orders@acmedist.com', 'phone' => '555-210-1000'],
                ['name' => 'Global Wholesale Ltd', 'email' => 'sales@globalwholesale.com', 'phone' => '555-210-2000'],
                ['name' => 'Metro Supply Co', 'email' => 'support@metrosupply.co', 'phone' => '555-210-3000'],
                ['name' => 'Prime Electronics Depot', 'email' => 'accounts@primedepot.com', 'phone' => '555-210-4000'],
                ['name' => 'EverGreen Stationers', 'email' => 'hello@evergreenstat.com', 'phone' => '555-210-5000'],
                ['name' => 'Urban Foods Trading', 'email' => 'orders@urbanfoods.trade', 'phone' => '555-210-6000'],
                ['name' => 'NorthRiver Essentials', 'email' => 'hello@northriver-essentials.com', 'phone' => '555-210-7000'],
            ];
            foreach ($vendorData as $vd) {
                Vendor::firstOrCreate(
                    ['name' => $vd['name'], 'shop_id' => $shop->id],
                    ['email' => $vd['email'], 'phone' => $vd['phone']]
                );
            }
        }

        // Purchases with items (realistic costs at ~60-80% of sell price), spread across recent dates
        $vendors = Vendor::where('shop_id', $shop->id)->take(3)->get();
        $products = Product::where('shop_id', $shop->id)->orderBy('id')->take(6)->get();
        if ($vendors->count() && $products->count() && Purchase::count() < 10) {
            for ($p=1; $p<=8; $p++) {
                DB::transaction(function () use ($shop, $vendors, $products) {
                    $vendor = $vendors->random();
                    $lines = $products->random(rand(2,4));
                    $purchaseDate = Carbon::now()->subDays(rand(5, 30))->setTime(rand(9,17), rand(0,59));
                    $subtotal = 0; $items = [];
                    foreach ($lines as $prod) {
                        $qty = rand(5,15);
                        $unitCost = round(((float)$prod->price) * (rand(60,80)/100), 2);
                        $lineTotal = round($qty * $unitCost, 2);
                        $subtotal += $lineTotal;
                        $items[] = [
                            'product_id' => $prod->id,
                            'quantity' => $qty,
                            'unit_cost' => $unitCost,
                            'line_total' => $lineTotal,
                            'shop_id' => $shop->id,
                            'created_at' => $purchaseDate,
                            'updated_at' => $purchaseDate,
                        ];
                    }
                    $taxPercent = 5.0;
                    $taxTotal = round($subtotal * ($taxPercent/100), 2);
                    $otherCharges = rand(0,1) ? 0 : (rand(10,30)); // delivery/handling occasionally
                    $grand = round($subtotal + $taxTotal + $otherCharges, 2);
                    $paid = [0, round($grand/2,2), $grand][rand(0,2)];
                    $status = $paid >= $grand ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid');

                    $purchase = Purchase::create([
                        'shop_id' => $shop->id,
                        'user_id' => null,
                        'vendor_id' => $vendor->id,
                        'vendor_name' => $vendor->name,
                        'vendor_email' => $vendor->email,
                        'vendor_phone' => $vendor->phone,
                        'subtotal' => round($subtotal, 2),
                        'tax_total' => $taxTotal,
                        'other_charges' => $otherCharges,
                        'grand_total' => $grand,
                        'amount_paid' => $paid,
                        'payment_method' => $paid === 0 ? 'credit' : 'bank',
                        'notes' => 'Seed purchase',
                        'status' => $status,
                        'created_at' => $purchaseDate,
                        'updated_at' => $purchaseDate,
                    ]);

                    foreach ($items as $it) {
                        $purchase->items()->create($it);
                        // Increase stock and log movement, following existing style
                        $prod = Product::lockForUpdate()->find($it['product_id']);
                        if ($prod) {
                            if (!is_null($prod->stock)) { $prod->increment('stock', (int)$it['quantity']); }
                            StockMovement::create([
                                'shop_id' => $shop->id,
                                'product_id' => $prod->id,
                                'type' => 'adjustment',
                                'quantity_change' => (int)$it['quantity'],
                                'reference' => 'SEED',
                                'notes' => 'Seed purchase movement',
                                'user_id' => null,
                                'created_at' => $purchaseDate,
                                'updated_at' => $purchaseDate,
                            ]);
                        }
                    }
                });
            }
        }
    }
}
