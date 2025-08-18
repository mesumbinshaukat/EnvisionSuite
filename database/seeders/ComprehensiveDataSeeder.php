<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Category;
use App\Models\Vendor;
use App\Models\PricingRule;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Account;
use Carbon\Carbon;

class ComprehensiveDataSeeder extends Seeder
{
    public function run(): void
    {
        $shops = $this->createShops();
        
        foreach ($shops as $shop) {
            $this->seedShopData($shop);
        }
    }
    
    private function createShops()
    {
        $shopsData = [
            ['name' => 'Main Store Downtown', 'code' => 'MAIN', 'currency' => 'PKR', 'location' => 'Downtown Plaza, Karachi'],
            ['name' => 'North Branch', 'code' => 'NORTH', 'currency' => 'PKR', 'location' => 'North Nazimabad, Karachi'],
            ['name' => 'South Outlet', 'code' => 'SOUTH', 'currency' => 'PKR', 'location' => 'Clifton Block 2, Karachi'],
        ];
        
        $shops = [];
        foreach ($shopsData as $shopData) {
            $shop = Shop::firstOrCreate(['code' => $shopData['code']], $shopData + ['is_active' => true]);
            $shops[] = $shop;
        }
        return $shops;
    }
    
    private function seedShopData($shop)
    {
        $this->createCategories($shop);
        $vendors = $this->createVendors($shop);
        $products = $this->createProducts($shop);
        $customers = $this->createCustomers($shop);
        $this->createPricingRules($shop, $products);
        $this->createJournalEntries($shop);
    }
    
    private function createCategories($shop)
    {
        $categories = [
            ['name' => 'Electronics', 'type' => 'goods', 'description' => 'Electronic devices'],
            ['name' => 'Food Items', 'type' => 'goods', 'description' => 'Food and beverages'],
            ['name' => 'Clothing', 'type' => 'goods', 'description' => 'Apparel and fashion'],
            ['name' => 'Home & Garden', 'type' => 'goods', 'description' => 'Home supplies'],
            ['name' => 'Health & Beauty', 'type' => 'goods', 'description' => 'Personal care'],
            ['name' => 'Stationery', 'type' => 'goods', 'description' => 'Office supplies'],
        ];
        
        foreach ($categories as $catData) {
            Category::firstOrCreate(
                ['name' => $catData['name'], 'shop_id' => $shop->id],
                $catData + ['user_id' => null]
            );
        }
    }
    
    private function createVendors($shop)
    {
        $vendorsData = [
            ['name' => 'TechWorld Distributors', 'email' => 'orders@techworld.pk', 'phone' => '+92-21-1111-0001'],
            ['name' => 'Metro Wholesale Hub', 'email' => 'sales@metro.pk', 'phone' => '+92-21-1111-0002'],
            ['name' => 'Global Import Export', 'email' => 'info@global.pk', 'phone' => '+92-21-1111-0003'],
            ['name' => 'Premium Suppliers', 'email' => 'contact@premium.pk', 'phone' => '+92-21-1111-0004'],
        ];
        
        $vendors = [];
        foreach ($vendorsData as $vendorData) {
            $vendor = Vendor::firstOrCreate(
                ['name' => $vendorData['name'], 'shop_id' => $shop->id],
                $vendorData
            );
            $vendors[] = $vendor;
        }
        return $vendors;
    }
    
    private function createProducts($shop)
    {
        $categories = Category::where('shop_id', $shop->id)->get();
        $productsData = [
            ['sku' => 'ELC-001', 'name' => 'Samsung Galaxy A54', 'price' => 89999, 'stock' => 25, 'category' => 'Electronics'],
            ['sku' => 'ELC-002', 'name' => 'iPhone 14 Pro', 'price' => 349999, 'stock' => 15, 'category' => 'Electronics'],
            ['sku' => 'FOD-001', 'name' => 'Basmati Rice 5kg', 'price' => 2499, 'stock' => 100, 'category' => 'Food Items'],
            ['sku' => 'FOD-002', 'name' => 'Cooking Oil 1L', 'price' => 599, 'stock' => 200, 'category' => 'Food Items'],
            ['sku' => 'CLO-001', 'name' => 'Cotton T-Shirt', 'price' => 1999, 'stock' => 60, 'category' => 'Clothing'],
            ['sku' => 'HOM-001', 'name' => 'Vacuum Cleaner', 'price' => 25999, 'stock' => 20, 'category' => 'Home & Garden'],
        ];
        
        $products = [];
        foreach ($productsData as $productData) {
            $category = $categories->where('name', $productData['category'])->first();
            if ($category) {
                $product = Product::firstOrCreate(
                    ['sku' => $productData['sku'] . '-' . $shop->code],
                    [
                        'name' => $productData['name'],
                        'description' => $productData['name'] . ' - ' . $shop->name,
                        'price' => $productData['price'],
                        'stock' => $productData['stock'],
                        'tax_rate' => 17.00,
                        'is_active' => true,
                        'shop_id' => $shop->id,
                        'category_id' => $category->id,
                    ]
                );
                $products[] = $product;
            }
        }
        return $products;
    }
    
    private function createCustomers($shop)
    {
        $customersData = [
            ['name' => 'Ahmed Ali Khan', 'email' => 'ahmed.khan@email.com', 'phone' => '+92-300-1234567'],
            ['name' => 'Fatima Sheikh', 'email' => 'fatima.sheikh@email.com', 'phone' => '+92-300-2345678'],
            ['name' => 'Muhammad Hassan', 'email' => 'hassan.muhammad@email.com', 'phone' => '+92-300-3456789'],
            ['name' => 'Ayesha Malik', 'email' => 'ayesha.malik@email.com', 'phone' => '+92-300-4567890'],
        ];
        
        $customers = [];
        foreach ($customersData as $customerData) {
            $customer = Customer::firstOrCreate(
                ['email' => $customerData['email'] . '.' . strtolower($shop->code)],
                [
                    'name' => $customerData['name'],
                    'phone' => $customerData['phone'],
                    'address_line1' => 'Block 15, Gulshan-e-Iqbal',
                    'city' => 'Karachi',
                    'country' => 'Pakistan',
                    'is_active' => true,
                    'shop_id' => $shop->id,
                ]
            );
            $customers[] = $customer;
        }
        return $customers;
    }
    
    private function createPricingRules($shop, $products)
    {
        if (empty($products)) return;
        
        $rules = [
            [
                // Global-like default margin applied to the first product (schema requires product_id)
                'product_id' => $products[0]->id,
                'cost_basis' => 'fixed',
                'margin_type' => 'percent',
                'margin_value' => 35.0,
                'scope_type' => 'all_units',
                'notes' => 'Default 35% margin',
            ],
            [
                'product_id' => $products[0]->id,
                'cost_basis' => 'average',
                'margin_type' => 'percent',
                'margin_value' => 25.0,
                'scope_type' => 'specific_qty',
                'scope_qty' => 10,
                'discount_type' => 'percent',
                'discount_value' => 5.0,
                'notes' => 'Bulk discount rule',
            ],
        ];
        
        foreach ($rules as $ruleData) {
            PricingRule::firstOrCreate(
                ['shop_id' => $shop->id, 'product_id' => $ruleData['product_id']],
                $ruleData + [
                    'fixed_cost' => 0,
                    'discount_type' => $ruleData['discount_type'] ?? 'none',
                    'discount_value' => $ruleData['discount_value'] ?? 0,
                    'active' => true,
                    'starts_at' => Carbon::now()->subDays(30),
                    'ends_at' => Carbon::now()->addDays(365),
                ]
            );
        }
    }
    
    private function createJournalEntries($shop)
    {
        $accounts = Account::all();
        if ($accounts->isEmpty()) return;
        
        $cashAccount = $accounts->where('code', '1000')->first();
        $salesAccount = $accounts->where('code', '4000')->first();
        $inventoryAccount = $accounts->where('code', '1200')->first();
        $cogsAccount = $accounts->where('code', '5000')->first();
        
        if (!$cashAccount || !$salesAccount) return;
        
        // Sample journal entries
        for ($i = 1; $i <= 10; $i++) {
            $entryDate = Carbon::now()->subDays(rand(1, 30));
            $amount = rand(5000, 50000);
            
            $entry = JournalEntry::create([
                'date' => $entryDate,
                'memo' => 'JE-' . $shop->code . '-' . str_pad($i, 4, '0', STR_PAD_LEFT) . ' | Sample journal entry #' . $i . ' for ' . $shop->name,
                'shop_id' => $shop->id,
                // Optionally set references for traceability
                'reference_type' => 'seed',
                'reference_id' => null,
                'created_at' => $entryDate,
                'updated_at' => $entryDate,
            ]);
            
            // Debit Cash
            JournalLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $cashAccount->id,
                'debit' => $amount,
                'credit' => 0,
                'memo' => 'Cash received',
            ]);
            
            // Credit Sales
            JournalLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $salesAccount->id,
                'debit' => 0,
                'credit' => $amount,
                'memo' => 'Sales revenue',
            ]);
        }
    }
}
