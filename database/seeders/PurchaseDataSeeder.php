<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Shop;
use App\Models\User;
use App\Models\Product;
use App\Models\Vendor;
use App\Models\Purchase;
use App\Models\PurchaseItem;

class PurchaseDataSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();
        if (!$shop) {
            $this->command?->warn('No shop found; skipping PurchaseDataSeeder.');
            return;
        }
        $shopId = $shop->id;

        // Ensure some vendors exist
        $vendorNames = [
            'Acme Supplies', 'Global Traders', 'Prime Wholesale', 'Alpha Distributors', 'Metro Imports',
            'Sunrise Goods', 'Evergreen Partners', 'Northwind Vendors', 'BluePeak Supply', 'Vertex Commerce'
        ];
        foreach ($vendorNames as $i => $name) {
            $userId = ($i % 2) + 1;
            Vendor::firstOrCreate(
                ['shop_id' => $shopId, 'name' => $name],
                [
                    'email' => Str::slug($name).'@example.com',
                    'phone' => '+1-555-01'.str_pad((string)($i+10), 2, '0', STR_PAD_LEFT),
                    'address' => ($i+100).' Market Street',
                    'balance' => 0,
                    'user_id' => $userId,
                ]
            );
        }

        $vendors = Vendor::where('shop_id', $shopId)->inRandomOrder()->get();
        if ($vendors->isEmpty()) {
            $this->command?->warn('No vendors available; skipping PurchaseDataSeeder.');
            return;
        }

        $products = Product::inRandomOrder()->limit(50)->get();
        if ($products->isEmpty()) {
            $this->command?->warn('No products available; skipping PurchaseDataSeeder.');
            return;
        }

        // Generate purchases for the last 60 days
        $days = 60;
        $now = Carbon::now();
        for ($d = $days - 1; $d >= 0; $d--) {
            $date = $now->copy()->subDays($d);
            // 0-4 purchases per day
            $purchasesToday = random_int(0, 4);
            for ($k = 0; $k < $purchasesToday; $k++) {
                $vendor = $vendors->random();
                $userId = (($d + $k) % 2) + 1; // alternate across days and per-day index
                // Create purchase shell
                $purchase = new Purchase([
                    'shop_id' => $shopId,
                    'user_id' => $userId,
                    'vendor_id' => $vendor->id,
                    'vendor_name' => $vendor->name,
                    'vendor_email' => $vendor->email,
                    'vendor_phone' => $vendor->phone,
                    'subtotal' => 0,
                    'tax_total' => 0,
                    'other_charges' => 0,
                    'grand_total' => 0,
                    'amount_paid' => 0,
                    'payment_method' => 'bank_transfer',
                    'status' => 'open',
                    'notes' => null,
                ]);
                $purchase->save();
                // Randomize time within the day
                $createdAt = $date->copy()->setTime(random_int(8, 19), random_int(0,59), random_int(0,59));
                $purchase->created_at = $createdAt;
                $purchase->updated_at = $createdAt;
                $purchase->save();

                // 1-6 line items
                $lines = random_int(1, 6);
                $subtotal = 0;
                for ($i = 0; $i < $lines; $i++) {
                    $product = $products->random();
                    $qty = random_int(1, 25);
                    // Vary costs with some noise
                    $baseCost = max(1, ($product->cost ?? $product->price ?? 10));
                    $unitCost = round($baseCost * (0.7 + (random_int(0, 60) / 100)), 2); // 0.7x to 1.3x
                    $lineTotal = round($unitCost * $qty, 2);
                    $subtotal += $lineTotal;

                    $pi = new PurchaseItem([
                        'purchase_id' => $purchase->id,
                        'shop_id' => $shopId,
                        'product_id' => $product->id,
                        'quantity' => $qty,
                        'unit_cost' => $unitCost,
                        'line_total' => $lineTotal,
                    ]);
                    $pi->save();
                    $pi->created_at = $createdAt;
                    $pi->updated_at = $createdAt;
                    $pi->save();
                }
                $tax = round($subtotal * 0.05, 2);
                $other = round($subtotal * (random_int(0, 8) / 100), 2);
                $grand = round($subtotal + $tax + $other, 2);
                $paid = round($grand * ([0, 0.25, 0.5, 0.75, 1][random_int(0, 4)]), 2);
                $purchase->subtotal = $subtotal;
                $purchase->tax_total = $tax;
                $purchase->other_charges = $other;
                $purchase->grand_total = $grand;
                $purchase->amount_paid = $paid;
                $purchase->status = $paid >= $grand ? 'paid' : ($paid > 0 ? 'partial' : 'open');
                $purchase->save();
            }
        }

        $this->command?->info('PurchaseDataSeeder: seeded purchases, items, and vendors for the last '.$days.' days.');
    }
}
