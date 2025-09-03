<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Shop;
use App\Models\User;
use App\Models\Product;
use App\Models\Vendor;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\VendorPayment;
use App\Services\LedgerService;

class RichTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();
        if (!$shop) { return; }

        $user = User::first();
        if (!$user) { return; }

        // Ensure at least some vendors and products exist
        if (Vendor::where('shop_id', $shop->id)->count() < 3) {
            $seedVendors = [
                ['name' => 'CityMart Distributors', 'email' => 'citymart@vendors.pk', 'phone' => '+92-21-1100-0001'],
                ['name' => 'Premier Foods Pvt', 'email' => 'orders@premier.pk', 'phone' => '+92-21-1100-0002'],
                ['name' => 'Universal Trade Co', 'email' => 'sales@universal.pk', 'phone' => '+92-21-1100-0003'],
            ];
            foreach ($seedVendors as $v) {
                Vendor::firstOrCreate(['shop_id' => $shop->id, 'name' => $v['name']], $v);
            }
        }

        $vendors = Vendor::where('shop_id', $shop->id)->inRandomOrder()->take(3)->get();
        $products = Product::where('shop_id', $shop->id)->where('is_active', true)->take(8)->get();
        if ($vendors->isEmpty() || $products->isEmpty()) { return; }

        // Create a set of purchases with varied statuses
        for ($n = 0; $n < 6; $n++) {
            DB::transaction(function () use ($shop, $user, $vendors, $products, $n) {
                $vendor = $vendors[$n % $vendors->count()];
                $createdAt = Carbon::now()->subDays(10 - $n)->setTime(rand(9,18), rand(0,59));

                $lines = $products->random(rand(2,4));
                $subtotal = 0; $items = [];
                foreach ($lines as $p) {
                    $qty = rand(3,10);
                    $unitCost = round(((float)$p->price ?: 1000) * (rand(55,80)/100), 2);
                    $lineTotal = round($qty * $unitCost, 2);
                    $subtotal += $lineTotal;
                    $items[] = [
                        'product_id' => $p->id,
                        'quantity' => $qty,
                        'unit_cost' => $unitCost,
                        'line_total' => $lineTotal,
                        'shop_id' => $shop->id,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ];
                }
                $tax = round($subtotal * 0.05, 2);
                $other = rand(0,1) ? 0 : rand(200,800);
                $grand = round($subtotal + $tax + $other, 2);

                // Rotate statuses: open/unpaid (amount_paid=0), partial, paid
                if ($n % 3 === 0) { $paid = 0; $status = 'open'; $method = 'credit'; }
                elseif ($n % 3 === 1) { $paid = round($grand * 0.5, 2); $status = 'partial'; $method = 'bank_transfer'; }
                else { $paid = $grand; $status = 'paid'; $method = 'bank_transfer'; }

                $purchase = Purchase::create([
                    'shop_id' => $shop->id,
                    'user_id' => $user->id,
                    'vendor_id' => $vendor->id,
                    'vendor_name' => $vendor->name,
                    'vendor_email' => $vendor->email,
                    'vendor_phone' => $vendor->phone,
                    'subtotal' => $subtotal,
                    'tax_total' => $tax,
                    'other_charges' => $other,
                    'grand_total' => $grand,
                    'amount_paid' => $paid,
                    'payment_method' => $method,
                    'notes' => 'Rich seed purchase #'.($n+1),
                    'status' => $status,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
                foreach ($items as $it) { $purchase->items()->create($it); }

                // Post double-entry to ledger (Inventory/Cash or Accounts Payable)
                app(LedgerService::class)->postPurchase($purchase);

                // Update vendor running balance consistent with PurchaseController rule:
                // balance += (amount_paid - grand_total)
                if (!empty($purchase->vendor_id)) {
                    $vendor = Vendor::lockForUpdate()->find($purchase->vendor_id);
                    if ($vendor) {
                        $current = (float) ($vendor->balance ?? 0);
                        $delta = (float) ($purchase->amount_paid ?? 0) - (float) ($purchase->grand_total ?? 0);
                        $vendor->balance = round($current + $delta, 2);
                        $vendor->save();
                    }
                }
            });
        }

        // Create a payoff scenario: pick one vendor with open/partial purchases and settle one of them
        $targetVendor = Purchase::where('shop_id', $shop->id)
            ->whereIn('status', ['open','partial'])
            ->inRandomOrder()
            ->first()?->vendor;

        if ($targetVendor) {
            DB::transaction(function () use ($shop, $user, $targetVendor) {
                $purchase = Purchase::where('shop_id', $shop->id)
                    ->where('vendor_id', $targetVendor->id)
                    ->whereIn('status', ['open','partial'])
                    ->orderBy('created_at')
                    ->first();
                if (!$purchase) { return; }

                $due = round(max(0, (float)$purchase->grand_total - (float)$purchase->amount_paid), 2);
                if ($due <= 0.01) { return; }

                // Record a vendor payment and post to ledger (similar to controller)
                $payment = VendorPayment::create([
                    'shop_id' => $shop->id,
                    'user_id' => $user->id,
                    'vendor_id' => $targetVendor->id,
                    'date' => Carbon::now()->toDateString(),
                    'amount' => $due,
                    'payment_method' => 'bank_transfer',
                    'notes' => 'Seed payoff for purchase #'.$purchase->id,
                ]);

                app(LedgerService::class)->postVendorPayment(
                    (float)$due,
                    'bank_transfer',
                    $shop->id,
                    $user->id,
                    $payment->id,
                    'Vendor payment (seed) #'.$payment->id
                );

                // Update vendor running balance similar to controller logic
                $vendor = Vendor::lockForUpdate()->find($targetVendor->id);
                if ($vendor) {
                    $current = (float) ($vendor->balance ?? 0);
                    $vendor->balance = round($current + (float)$due, 2);
                    $vendor->save();
                }

                // Mark the selected purchase as fully paid to validate status propagation in reports
                $purchase->amount_paid = (float)$purchase->grand_total;
                $purchase->status = 'paid';
                $purchase->save();
            });
        }
    }
}
