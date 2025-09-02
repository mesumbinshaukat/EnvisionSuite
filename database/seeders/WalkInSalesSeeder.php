<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Shop;
use App\Models\User;
use App\Models\Product;
use App\Models\Sale;

class WalkInSalesSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Shop::first();
        if (!$shop) { return; }
        $user = User::first();
        if (!$user) { return; }

        $products = Product::where('shop_id', $shop->id)->where('is_active', true)->take(5)->get(['id','price','tax_rate']);
        if ($products->count() < 2) { return; }

        DB::transaction(function () use ($shop, $user, $products) {
            $scenarios = [
                ['qtys' => [[$products[0]->id, 2]], 'paid' => 0, 'note' => 'Walk-in: No name provided'],
                ['qtys' => [[$products[0]->id, 1], [$products[1]->id, 3]], 'paid' => 500, 'note' => 'Walk-in: John Doe (partial)'],
                ['qtys' => [[$products[1]->id, 2]], 'paid' => null, 'note' => 'Express order'],
                ['qtys' => [[$products[0]->id, 1], [$products[1]->id, 1]], 'paid' => 'full', 'note' => 'Walk-in: Table 7'],
            ];

            foreach ($scenarios as $idx => $sc) {
                $subtotal = 0; $tax = 0; $items = [];
                foreach ($sc['qtys'] as [$pid, $qty]) {
                    $prod = $products->firstWhere('id', $pid);
                    $unit = (float) $prod->price;
                    $lineSub = $unit * $qty;
                    $lineTax = round($lineSub * ((float)$prod->tax_rate/100), 2);
                    $lineTotal = $lineSub + $lineTax;
                    $subtotal += $lineSub; $tax += $lineTax;
                    $items[] = [
                        'product_id' => $pid,
                        'quantity' => $qty,
                        'unit_price' => $unit,
                        'original_unit_price' => $unit,
                        'sold_unit_price' => $unit,
                        'is_discounted' => false,
                        'margin_per_unit' => 0,
                        'margin_total' => 0,
                        'tax_amount' => $lineTax,
                        'total' => $lineTotal,
                        'shop_id' => $shop->id,
                    ];
                }
                $discount = 0; // keep simple
                $grand = round(($subtotal - $discount) + $tax, 2);
                $paid = 0.0;
                if ($sc['paid'] === 'full') { $paid = $grand; }
                elseif (is_numeric($sc['paid'])) { $paid = min($grand, (float) $sc['paid']); }
                $status = $paid >= $grand ? 'paid' : ($paid > 0 ? 'partial' : 'credit');

                $sale = Sale::create([
                    'customer_id' => null,
                    'user_id' => $user->id,
                    'status' => 'completed',
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'total' => $grand,
                    'amount_paid' => $paid,
                    'payment_method' => $paid > 0 ? 'cash' : 'credit',
                    'payment_status' => $status,
                    'reference' => null,
                    'note' => $sc['note'],
                    'shop_id' => $shop->id,
                    'created_at' => Carbon::now()->subDays(5 - $idx),
                    'updated_at' => Carbon::now()->subDays(5 - $idx),
                ]);

                foreach ($items as $it) { $sale->items()->create($it); }
            }
        });
    }
}
