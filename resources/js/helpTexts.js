// Centralized help text registry per-locale. Extend as needed.
export const helpTexts = {
  en: {
    // Common
    generic_required: 'This field is required.',
    search_global: 'Search any page by name and jump quickly.',
    language_switcher: 'Switch application language between English and Urdu.',
    // Sales
    sales_pos: 'Open the Point of Sale screen to create new sales.',
    sales_customers: 'Manage customers and their profiles.',
    sales_history: 'View a customer\'s historical purchases.',
    pricing_rules: 'Define discounts and price adjustments.',
    // Purchases
    vendors: 'Manage suppliers used for purchases.',
    purchases: 'Record purchases from vendors and update inventory.',
    expenses: 'Track operating expenses and payments.',
    // Inventory
    products: 'Create and manage products and SKUs.',
    categories: 'Organize products into categories.',
    adjustments: 'Adjust stock levels due to loss, damage or corrections.',
    inventory_loans: 'Track inventory items loaned out and returns.',
    inventory_report: 'Inventory quantities and valuation.',
    inventory_average: 'Average cost calculation details.',
    // Accounting
    ledger: 'View ledger accounts and balances.',
    journals: 'List of journal entries posted to the ledger.',
    trial_balance: 'Trial balance report for all accounts.',
    profit_loss: 'Income statement for a selected period.',
    // Finance
    finance_summary: 'Overview of financial KPIs and summaries.',
    // Admin
    shops: 'Manage shops/branches and settings.',
    // Product form
    product_name: 'Enter the product display name customers will see.',
    product_sku: 'Unique stock keeping unit to identify the product.',
    product_description: 'Optional description to help staff/customers.',
    product_price: 'Selling price per unit. Taxes may apply separately.',
    product_stock: 'Initial on-hand quantity being recorded.',
    product_tax_rate: 'Percentage tax to apply (e.g., 17 for 17%).',
    product_category: 'Optional category for organizing products.',
    product_is_active: 'Inactive products are hidden from POS and listings.',
  },
  ur: {
    // Common
    generic_required: 'یہ فیلڈ لازمی ہے۔',
    search_global: 'کسی بھی صفحہ کا نام تلاش کریں اور فوراً جائیں۔',
    language_switcher: 'ایپ کی زبان انگریزی اور اردو کے درمیان تبدیل کریں۔',
    // Sales
    sales_pos: 'نئی سیلز بنانے کے لیے پی او ایس اسکرین کھولیں۔',
    sales_customers: 'کسٹمرز اور ان کی پروفائلز منظم کریں۔',
    sales_history: 'کسٹمر کی سابقہ خریداری دیکھیں۔',
    pricing_rules: 'ڈسکاؤنٹس اور قیمت میں تبدیلیاں سیٹ کریں۔',
    // Purchases
    vendors: 'سپلائرز کو منظم کریں جو خریداری کے لیے استعمال ہوتے ہیں۔',
    purchases: 'ویینڈرز سے خریداری ریکارڈ کریں اور انوینٹری اپڈیٹ کریں۔',
    expenses: 'آپریٹنگ اخراجات اور ادائیگیاں ٹریک کریں۔',
    // Inventory
    products: 'مصنوعات اور ایس کے یوز بنائیں اور منظم کریں۔',
    categories: 'مصنوعات کو کیٹیگریز میں منظم کریں۔',
    adjustments: 'نقصان، خرابی یا تصحیح کی وجہ سے اسٹاک کی سطح ایڈجسٹ کریں۔',
    inventory_loans: 'ادھار دی گئی انوینٹری اور واپسی کو ٹریک کریں۔',
    inventory_report: 'انوینٹری مقدار اور ویلیوایشن۔',
    inventory_average: 'اوسط لاگت کے حساب کی تفصیلات۔',
    // Accounting
    ledger: 'لیجر اکاؤنٹس اور بیلنس دیکھیں۔',
    journals: 'لیجر میں پوسٹ کردہ جرنل اندراجات کی فہرست۔',
    trial_balance: 'تمام اکاؤنٹس کے لیے ٹرائل بیلنس رپورٹ۔',
    profit_loss: 'منتخب مدت کے لیے منافع و نقصان کا بیان۔',
    // Finance
    finance_summary: 'مالیاتی کے پی آئیز اور خلاصوں کا جائزہ۔',
    // Admin
    shops: 'شاپس/برانچز اور سیٹنگز منظم کریں۔',
    // Product form
    product_name: 'وہ نام درج کریں جو کسٹمرز دیکھیں گے۔',
    product_sku: 'مصنوعات کی منفرد شناخت کے لیے ایس کے یو۔',
    product_description: 'اختیاری تفصیل جو عملہ/کسٹمرز کی مدد کرے۔',
    product_price: 'فی یونٹ سیلنگ قیمت۔ ٹیکس الگ سے لاگو ہو سکتا ہے۔',
    product_stock: 'موجودہ اسٹاک کی ابتدائی مقدار۔',
    product_tax_rate: 'لاگو ٹیکس فیصد (مثلاً 17 کا مطلب 17%).',
    product_category: 'مصنوعات کو منظم کرنے کے لیے اختیاری کیٹیگری۔',
    product_is_active: 'غیر فعال مصنوعات پی او ایس اور فہرستوں میں نظر نہیں آئیں گی۔',
  }
};

export function getHelpText(locale, key) {
  return (helpTexts[locale] && helpTexts[locale][key]) || (helpTexts.en && helpTexts.en[key]) || '';
}
