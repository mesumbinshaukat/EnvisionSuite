<?php

namespace App\Services;

use App\Models\PricingRule;
use App\Models\PurchaseItem;
use App\Models\Product;
use Carbon\Carbon;

class PricingService
{
    public function activeRule(int $productId, ?int $shopId = null): ?PricingRule
    {
        $now = Carbon::now();
        return PricingRule::where('product_id', $productId)
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->where('active', true)
            ->where(function($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->orderBy('id', 'desc')
            ->first();
    }

    public function computePrice(int $productId, ?int $shopId = null): array
    {
        $product = Product::findOrFail($productId);
        $rule = $this->activeRule($productId, $shopId);
        if (!$rule) {
            // fallback: use product->price as sold price
            return [
                'cost' => null,
                'base_price' => (float) $product->price,
                'sold_price' => (float) $product->price,
                'rule' => null,
            ];
        }
        $cost = $this->resolveCost($productId, $shopId, $rule);
        $base = $this->applyMargin($cost, $rule->margin_type, (float)$rule->margin_value);
        $sold = $this->applyDiscount($base, $rule->discount_type, (float)$rule->discount_value);
        return [
            'cost' => round($cost, 4),
            'base_price' => round($base, 2),
            'sold_price' => round($sold, 2),
            'rule' => $rule,
        ];
    }

    protected function resolveCost(int $productId, ?int $shopId, PricingRule $rule): float
    {
        if ($rule->cost_basis === 'fixed') {
            return max(0.0, (float) ($rule->fixed_cost ?? 0));
        }
        if ($rule->cost_basis === 'last') {
            $last = PurchaseItem::query()
                ->where('product_id', $productId)
                ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
                ->orderByDesc('id')
                ->first();
            return $last ? (float)$last->unit_cost : 0.0;
        }
        // average
        $q = PurchaseItem::query()
            ->where('product_id', $productId)
            ->when($shopId, fn($qq) => $qq->where('shop_id', $shopId));
        $totQty = (int) (clone $q)->sum('quantity');
        if ($totQty <= 0) return 0.0;
        $weighted = (float) (clone $q)->selectRaw('SUM(quantity * unit_cost) as s')->value('s');
        return $totQty > 0 ? ($weighted / $totQty) : 0.0;
    }

    protected function applyMargin(float $cost, string $type, float $value): float
    {
        if ($type === 'amount') return max(0.0, $cost + $value);
        // percent
        return max(0.0, $cost * (1.0 + max(0.0, $value) / 100.0));
    }

    protected function applyDiscount(float $base, string $type, float $value): float
    {
        if ($type === 'amount') return max(0.0, $base - max(0.0, $value));
        if ($type === 'percent') return max(0.0, $base * (1.0 - max(0.0, min($value,100)) / 100.0));
        return max(0.0, $base);
    }
}
