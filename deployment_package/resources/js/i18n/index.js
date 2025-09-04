import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getHelpText } from '@/helpTexts';
import { router } from '@inertiajs/react';

const dictionaries = {
  en: {
    dashboard: 'Dashboard',
    sales: 'Sales', sales_pos: 'Sales/POS', purchases: 'Purchases', inventory: 'Inventory', accounting: 'Accounting', reports: 'Reports', finance: 'Finance', admin: 'Admin',
    pos: 'POS', customers: 'Customers', customer_history: 'Customer History', walkin_customers: 'Walk-in Customers', pricing_rules: 'Pricing Rules',
    vendors: 'Vendors', expenses: 'Expenses', products: 'Products', categories: 'Categories', adjustments: 'Adjustments', inventory_loans: 'Inventory Loans',
    inventory_report: 'Inventory Report', avg_cost_report: 'Avg Cost Report', ledger: 'Ledger', accounts: 'Accounts', journals: 'Journals', trial_balance: 'Trial Balance', profit_loss: 'Profit & Loss',
    sales_report: 'Sales Report', purchases_report: 'Purchases Report', finance_summary: 'Finance Summary', shops: 'Shops',
    money_loans: 'Money Loans', new_money_loan: 'New Money Loan', record_money_loan: 'Record Money Loan',
    transactions: 'Transactions', new_transaction: 'New Transaction', new: 'New',
    equity_dashboard: 'Equity & Store Worth', assets: 'Assets', liabilities: 'Liabilities', net_worth: 'Net Worth',
    store_worth: 'Store Worth (Assets - Liabilities)', net_cash_after_liabilities: 'Net Cash after Liabilities',
    average_sales: 'Average Sales', avg_daily: 'Avg Daily', avg_weekly: 'Avg Weekly', avg_monthly: 'Avg Monthly',
    assets_breakdown: 'Assets Breakdown', net_overview: 'Net Overview', price_increase_trend: 'Price Increase Trend',
    vendor_price_comparison: 'Vendor Price Comparison', probability_high_sales: 'Probability of Higher Sales',
    inventory_value: 'Inventory', bank_balance: 'Bank', cash_balance: 'Cash', receivables: 'Receivables', payables: 'Payables',
    counterparty_type: 'Counterparty Type', vendor: 'Vendor', external_person: 'External Person', counterparty_name: 'Counterparty Name',
    direction: 'Direction', lend: 'Lend (we give)', borrow: 'Borrow (we take)',
    source: 'Source', cash: 'Cash', bank: 'Bank', amount: 'Amount', date: 'Date', note: 'Note',
    purpose: 'Purpose', general: 'General', payoff_vendor_debt: 'Payoff Vendor Debt',
    pending_debt: 'Pending Debt', no_pending_debt_for_selected_vendor: 'No Pending Debt For Selected Vendor',
    must_be_positive: 'must be positive', insufficient_funds: 'Insufficient funds', is_required: 'is required', available: 'Available',
    vendor_debt_purchases: 'Vendor Debt Purchases',
    profit_loss: 'Profit & Loss', export_excel: 'Export Excel', trends_over_time: 'Trends over time',
    revenue: 'Revenue', expenses: 'Expenses', cogs: 'COGS', gross_profit: 'Gross Profit', net_profit: 'Net Profit',
    previous_period_comparison: 'Previous Period Comparison', year_over_year_comparison: 'Year-over-Year Comparison', not_available: 'Not available',
    from: 'From', to_label: 'To', bucket: 'Bucket', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', apply: 'Apply',
    view_detailed_revenue_journals: 'View detailed revenue journals →', view_detailed_expense_journals: 'View detailed expense journals →',
    cogs_computed: 'COGS (Computed)', operating_expenses_excl_cogs: 'Operating Expenses (excl. COGS)', gross_margin_pct: 'Gross Margin %',
    revenue_accounts: 'Revenue Accounts', expense_accounts: 'Expense Accounts',
    code: 'Code', account: 'Account', amount: 'Amount', metric: 'Metric', current: 'Current', previous: 'Previous', delta_vs_prev: 'Δ (%, vs prev)',
    drill_account_journals: 'Drill down to account journals', computed_avg_cost_note: 'Computed average cost for sold units in period',
    top_products_by_gross_profit: 'Top Products (by Gross Profit)', product: 'Product', qty: 'Qty', customer: 'Customer',
    top_customers_by_gross_profit: 'Top Customers (by Gross Profit)',
    profit_loss_help: 'Shows Revenue minus all Expenses including computed COGS (purchase taxes/charges allocated). Period is based on From/To dates.',
    revenue_accounts_help: 'Each revenue account shows net credit (credit - debit) over the selected period.',
    expense_accounts_help: 'Each expense account shows net debit (debit - credit) over the selected period. COGS is appended as a computed expense.',
    drill_customer_ledger: 'Open customer ledger',
    drill_down_account_journals: 'Drill down to account journals',
    legend_revenue: 'Revenue', legend_expenses: 'Expenses', legend_cogs: 'COGS', legend_gross_profit: 'Gross Profit',
    apply_filters: 'Apply',
    save: 'Save', cancel: 'Cancel', back: 'Back',
    search_placeholder: 'Search pages…', language: 'Language', english: 'English', urdu: 'Urdu',
    // Layout/Profile
    profile: 'Profile', log_out: 'Log Out',
    // Transactions/Create canonical keys
    payoff_vendor_debt: 'Payoff Vendor Debt',
    pending_debt: 'Pending Debt',
    no_pending_debt_for_selected_vendor: 'No Pending Debt For Selected Vendor',
    // Dashboard
    sales_today: 'Sales Today', sales_this_month: 'Sales This Month', orders: 'Orders', products_label: 'Products', ledger_accounts: 'Ledger Accounts',
    avg_sold_price: 'Avg Sold Price', units_original: 'Units @ Original', units_discounted: 'Units @ Discounted', lent_out_units: 'Lent-Out Units',
    cash_in_hand: 'Cash in Hand', bank_balance_label: 'Bank Balance', receivables_label: 'Receivables', payables_label: 'Payables', net_profit_month: 'Net Profit (Month)',
    quick_actions: 'Quick Actions', inventory_loans_label: 'Inventory Loans', new_loan: 'New Loan', sales_report_label: 'Sales Report', inventory_report_label: 'Inventory Report',
    recent_journal_entries: 'Recent Journal Entries', date_label: 'Date', memo: 'Memo', action: 'Action', view: 'View', ledger_balances: 'Ledger Balances',
    // Purchases report
    purchases_over_time: 'Purchases over time', total_spend: 'Total Spend', total_quantity: 'Total Quantity', avg_unit_cost: 'Avg Unit Cost', outstanding_payables: 'Outstanding Payables',
    avg_daily_spend: 'Avg Daily Spend', avg_daily_qty: 'Avg Daily Qty', weekly_avg_spend: 'Weekly Avg Spend', monthly_avg_spend: 'Monthly Avg Spend',
    vendor_label: 'Vendor', product_label: 'Product', status_label: 'Status', any_status: 'Any status', export: 'Export', spend: 'Spend', quantity: 'Quantity',
    top_vendors: 'Top Vendors', top_purchased_products: 'Top Purchased Products',
    purchases_th_vendor: 'Vendor', purchases_th_purchases: 'Purchases', purchases_th_units: 'Units', purchases_th_avg_unit: 'Avg Unit', purchases_th_spend: 'Spend',
    detailed_purchases: 'Detailed Purchases', purchases_th_datetime: 'Date/Time', purchases_th_items: 'Items', purchases_th_subtotal: 'Subtotal', purchases_th_tax: 'Tax', purchases_th_other: 'Other', purchases_th_total: 'Total', purchases_th_paid: 'Paid', purchases_th_status: 'Status',
    // Sales report
    date_from: 'Date (From)', date_to: 'Date (To)', apply_label: 'Apply', export_excel_label: 'Export Excel',
    average_sold_price: 'Average Sold Price', units_original_price: 'Units @ Original Price', units_discounted_price: 'Units @ Discounted Price',
    id: 'ID', customer_label: 'Customer', type_label: 'Type', items: 'Items', units: 'Units', paid: 'Paid', payment: 'Payment', total: 'Total', total_label: 'Total:', count_label: 'Count',
    top_discounts_by_customer: 'Top Discounts by Customer', top_discounts_by_product: 'Top Discounts by Product', line_discount: 'Line Discount', header_discount: 'Header Discount', total_discount: 'Total Discount', walk_in: 'Walk-in',
    all_vendors: 'All vendors', all_products: 'All products', total_cost: 'Total Cost',
    // POS specific
    customer: 'Customer',
    payment_method: 'Payment Method', payment: 'Payment', amount_paid: 'Amount Paid',
    paid_now_note: 'Paid now will be recorded against this sale.',
    add_product: 'Add Product', select_product: 'Select product',
    scan_barcode: 'Scan Barcode', sku: 'SKU', focus_barcode: 'focus barcode', focus_product_search: 'focus product search',
    unit_price: 'Unit Price', line_subtotal: 'Line Subtotal', line_total: 'Line Total',
    subtotal: 'Subtotal', balance: 'Balance', remove: 'Remove',
    give_change: 'Change', quick_tender: 'Quick Tender', exact_cash: 'Exact', clear: 'Clear', checkout: 'Checkout',
    park_resume_carts: 'Hold / Resume Carts', hold_cart: 'Hold', clear_cart: 'Clear Holds', no_held_carts: 'No held carts', cart: 'Cart',
    // Sales/Create misc
    new_sale: 'New Sale', search_customer: 'Search customer', create_new_customer_hint: 'Or create a new customer (name and unique email):', new_customer_name: 'New customer name', new_customer_email: 'New customer email', auto_create_customer_note: 'If you leave the dropdown empty and provide these fields, we will auto-create and link this customer on save.',
    add_products: 'Add Products', search_and_add_items_tip: 'Search and add items. Quantity cannot exceed available stock.', search_by_name_or_sku: 'Search by name or SKU',
    discount: 'Discount', amount: 'Amount', percent: 'Percent', calculated: 'Calculated',
    prefilled_pricing_rules_tip: 'Prefilled from pricing rules; can be overridden.', line_total_edit_tip: 'You can edit this; Unit Price will be recalculated as Line Total / Qty.',
    status_label: 'Status', grand_total: 'Grand Total',
    // Payment options
    card: 'Card', mobile: 'Mobile', wallet: 'Wallet', credit: 'Credit',
    // Reports (POS)
    pos_reports: 'POS Reports', totals_by_payment_method: 'Totals by Payment Method', totals_by_cashier: 'Totals by Cashier', cashier: 'Cashier',
    unknown: 'Unknown', pos_disabled_redirecting: 'POS is disabled. Redirecting to Sales... ',

    // Products index
    search_products: 'Search products...', new_product: 'New Product', product_pricing: 'Product Pricing',
    selling_price_per_unit: 'Selling Price / Unit', stock: 'Stock', purchasing_cost_per_unit_avg: 'Purchasing Cost / Unit (Avg)', avg_selling_price: 'Avg Selling Price',
    old_qty: 'Old Qty', new_qty: 'New Qty', current_qty: 'Current Qty', actions: 'Actions',
    active: 'Active', inactive: 'Inactive', view: 'View', edit: 'Edit', delete: 'Delete',
    cannot_delete_due_to_stock: 'Cannot delete because stock exists. Adjust stock to zero first.',
    cannot_delete_due_to_links: 'Cannot delete because this product is referenced by other records.',
    cannot_delete: 'Cannot delete this product.',
    confirm_delete_product: 'Delete this product? This action cannot be undone.',
    delete_disabled: 'Delete disabled',
    view_product_tip: 'View product details', edit_product_tip: 'Edit this product',
    // Generic list labels
    name: 'Name', email: 'Email', phone: 'Phone', actions: 'Actions', type_label: 'Type',
    new_vendor: 'New Vendor', create_new_vendor_tip: 'Create a new vendor',
    edit_vendor_tip: 'Edit this vendor', delete_vendor_tip: 'Delete this vendor',
    create_new_category_tip: 'Create a new category', edit_category_tip: 'Edit this category', delete_category_tip: 'Delete this category',
    // Accounts
    account_code: 'Account Code', account_name: 'Account Name', account_type: 'Account Type', status: 'Status', open: 'Open', closed: 'Closed', all: 'All', search: 'Search', filter: 'Filter', view_history: 'View History', delete_account_confirm: 'Delete this account? Only accounts without journal entries can be deleted.',
    // Pagination and summaries
    page_of: (vars)=>`Page ${vars?.current} of ${vars?.last}`,
    showing_from_to_of: (vars)=>`Showing ${vars?.from} - ${vars?.to} of ${vars?.total}`
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    sales: 'سیلز', sales_pos: 'سیلز/پی او ایس', purchases: 'خریداری', inventory: 'انوینٹری', accounting: 'اکاؤنٹنگ', reports: 'رپورٹس', finance: 'فائنانس', admin: 'ایڈمن',
    pos: 'پی او ایس', customers: 'کسٹمرز', customer_history: 'کسٹمر ہسٹری', walkin_customers: 'واک اِن کسٹمرز', pricing_rules: 'پرائسنگ رولز',
    vendors: 'ویینڈرز', expenses: 'اخراجات', products: 'مصنوعات', categories: 'کیٹیگریز', adjustments: 'ایڈجسمنٹس', inventory_loans: 'انوینٹری لونز',
    inventory_report: 'انوینٹری رپورٹ', avg_cost_report: 'اوسط لاگت رپورٹ', ledger: 'لیجر', accounts: 'اکاؤنٹس', journals: 'جرنلز', trial_balance: 'ٹرائل بیلنس', profit_loss: 'منافع و نقصان',
    sales_report: 'سیلز رپورٹ', purchases_report: 'پرچیزز رپورٹ', finance_summary: 'فائنانس سمری', shops: 'شاپس',
    money_loans: 'رقمی قرضے', new_money_loan: 'نیا رقمی قرضہ', record_money_loan: 'رقمی قرضہ درج کریں',
    transactions: 'لین دین', new_transaction: 'نئی ٹرانزیکشن', new: 'نیا',
    equity_dashboard: 'ایکویٹی اور دکان کی مالیت', assets: 'اثاثے', liabilities: 'ذمہ داریاں', net_worth: 'خالص مالیت',
    store_worth: 'دکان کی مالیت (اثاثے - ذمہ داریاں)', net_cash_after_liabilities: 'ذمہ داریوں کے بعد خالص نقد',
    average_sales: 'اوسط فروخت', avg_daily: 'اوسط روزانہ', avg_weekly: 'اوسط ہفتہ وار', avg_monthly: 'اوسط ماہانہ',
    assets_breakdown: 'اثاثوں کی تقسیم', net_overview: 'خلاصہ نیٹ', price_increase_trend: 'قیمتوں میں اضافہ رجحان',
    vendor_price_comparison: 'ویینڈر قیمت موازنہ', probability_high_sales: 'زیادہ فروخت کے امکانات',
    inventory_value: 'انوینٹری', bank_balance: 'بینک', cash_balance: 'نقد', receivables: 'وصولیاں', payables: 'ادائگیاں',
    counterparty_type: 'فریق کی قسم', vendor: 'ویینڈر', external_person: 'باہر کا شخص', counterparty_name: 'فریق کا نام',
    direction: 'سمت', lend: 'قرض دینا (ہم دیں)', borrow: 'قرض لینا (ہم لیں)',
    source: 'ذریعہ', cash: 'نقد', bank: 'بینک', amount: 'رقم', date: 'تاریخ', note: 'نوٹ',
    purpose: 'مقصد', general: 'عام', payoff_vendor_debt: 'ویینڈر قرضہ ادا کریں',
    pending_debt: 'بقیہ واجب الادا', no_pending_debt_for_selected_vendor: 'منتخب ویینڈر کے لیے کوئی بقیہ واجب الادا نہیں',
    must_be_positive: 'مثبت ہونی چاہیے', insufficient_funds: 'ناکافی رقم', is_required: 'ضروری ہے', available: 'دستیاب',
    vendor_debt_purchases: 'ویینڈر قرضہ خریداری',
    profit_loss: 'منافع اور نقصان', export_excel: 'ایکسپورٹ ایکسل', trends_over_time: 'وقت کے ساتھ رجحانات',
    revenue: 'آمدنی', expenses: 'اخراجات', cogs: 'مال کی لاگت', gross_profit: 'مجموعی منافع', net_profit: 'خالص منافع',
    previous_period_comparison: 'پچھلے دورانیے کا موازنہ', year_over_year_comparison: 'سال بہ سال موازنہ', not_available: 'دستیاب نہیں',
    from: 'سے', to_label: 'تک', bucket: 'مدت', daily: 'روزانہ', weekly: 'ہفتہ وار', monthly: 'ماہانہ', apply: 'لاگو کریں',
    view_detailed_revenue_journals: 'تفصیلی آمدنی جرنلز دیکھیں →', view_detailed_expense_journals: 'تفصیلی اخراجات جرنلز دیکھیں →',
    cogs_computed: 'مال کی لاگت (حساب شدہ)', operating_expenses_excl_cogs: 'عملی اخراجات (مال کی لاگت کے بغیر)', gross_margin_pct: 'مجموعی منافع %',
    revenue_accounts: 'آمدنی اکاؤنٹس', expense_accounts: 'اخراجات اکاؤنٹس',
    code: 'کوڈ', account: 'اکاؤنٹ', amount: 'رقم', metric: 'میٹرک', current: 'موجودہ', previous: 'پچھلا', delta_vs_prev: 'فرق (٪، بمقابلہ پچھلا)',
    drill_account_journals: 'اکاؤنٹ جرنلز میں تفصیل دیکھیں', computed_avg_cost_note: 'مدت میں فروخت شدہ یونٹس کے لیے اوسط لاگت',
    top_products_by_gross_profit: 'بہترین مصنوعات (مجموعی منافع کے لحاظ سے)', product: 'مصنوع', qty: 'تعداد', customer: 'کسٹمر',
    top_customers_by_gross_profit: 'بہترین کسٹمرز (مجموعی منافع کے لحاظ سے)',
    profit_loss_help: 'آمدنی میں سے تمام اخراجات منفی کر کے COGS (خریداری کے ٹیکس/چارجز کی تقسیم) شامل کر کے دکھایا جاتا ہے۔ مدت "سے/تک" تاریخوں پر مبنی ہے۔',
    revenue_accounts_help: 'ہر آمدنی اکاؤنٹ منتخب مدت میں خالص کریڈٹ (کریڈٹ - ڈیبٹ) دکھاتا ہے۔',
    expense_accounts_help: 'ہر خرچ اکاؤنٹ منتخب مدت میں خالص ڈیبٹ (ڈیبٹ - کریڈٹ) دکھاتا ہے۔ COGS بطور حساب شدہ خرچ شامل ہے۔',
    drill_customer_ledger: 'کسٹمر لیجر کھولیں',
    drill_down_account_journals: 'اکاؤنٹ جرنلز کی تفصیل دیکھیں',
    legend_revenue: 'آمدنی', legend_expenses: 'اخراجات', legend_cogs: 'مال کی لاگت', legend_gross_profit: 'مجموعی منافع',
    apply_filters: 'لاگو کریں',
    save: 'محفوظ کریں', cancel: 'منسوخ کریں', back: 'واپس',
    search_placeholder: 'صفحات تلاش کریں…', language: 'زبان', english: 'انگریزی', urdu: 'اردو',
    // Layout/Profile
    profile: 'پروفائل', log_out: 'لاگ آؤٹ',
    // Transactions/Create canonical keys
    payoff_vendor_debt: 'ویینڈر قرضہ ادا کریں',
    pending_debt: 'بقیہ واجب الادا',
    no_pending_debt_for_selected_vendor: 'منتخب ویینڈر کے لیے کوئی بقیہ واجب الادا نہیں',
    // Dashboard
    sales_today: 'آج کی فروخت', sales_this_month: 'اس ماہ کی فروخت', orders: 'آرڈرز', products_label: 'مصنوعات', ledger_accounts: 'لیجر اکاؤنٹس',
    avg_sold_price: 'اوسط فروخت قیمت', units_original: 'یونٹس @ اصل قیمت', units_discounted: 'یونٹس @ رعایتی', lent_out_units: 'عاریتاً دیے گئے یونٹس',
    cash_in_hand: 'نقد رقم', bank_balance_label: 'بینک بیلنس', receivables_label: 'وصولیاں', payables_label: 'ادائگیاں', net_profit_month: 'خالص منافع (ماہ)',
    quick_actions: 'فوری اعمال', inventory_loans_label: 'انوینٹری لونز', new_loan: 'نیا لون', sales_report_label: 'سیلز رپورٹ', inventory_report_label: 'انوینٹری رپورٹ',
    recent_journal_entries: 'حالیہ جرنل اندراجات', date_label: 'تاریخ', memo: 'میمو', action: 'عمل', view: 'دیکھیں', ledger_balances: 'لیجر بیلنسز',
    // Purchases report
    purchases_over_time: 'وقت کے ساتھ خریداری', total_spend: 'کل خرچ', total_quantity: 'کل مقدار', avg_unit_cost: 'اوسط یونٹ لاگت', outstanding_payables: 'بقیہ ادائگیاں',
    avg_daily_spend: 'اوسط یومیہ خرچ', avg_daily_qty: 'اوسط یومیہ مقدار', weekly_avg_spend: 'ہفتہ وار اوسط خرچ', monthly_avg_spend: 'ماہانہ اوسط خرچ',
    vendor_label: 'ویینڈر', product_label: 'مصنوع', status_label: 'حالت', any_status: 'کوئی بھی حالت', export: 'ایکسپورٹ', spend: 'خرچ', quantity: 'تعداد',
    top_vendors: 'بہترین ویینڈر', top_purchased_products: 'سب سے زیادہ خریدی گئی مصنوعات',
    purchases_th_vendor: 'ویینڈر', purchases_th_purchases: 'خریداری', purchases_th_units: 'یونٹس', purchases_th_avg_unit: 'اوسط یونٹ', purchases_th_spend: 'خرچ',
    detailed_purchases: 'تفصیلی خریداری', purchases_th_datetime: 'تاریخ/وقت', purchases_th_items: 'آئٹمز', purchases_th_subtotal: 'ذیلی کل', purchases_th_tax: 'ٹیکس', purchases_th_other: 'دیگر', purchases_th_total: 'کل', purchases_th_paid: 'ادا شدہ', purchases_th_status: 'حالت',
    // Sales report
    date_from: 'تاریخ (سے)', date_to: 'تاریخ (تک)', apply_label: 'لاگو کریں', export_excel_label: 'ایکسپورٹ ایکسل',
    average_sold_price: 'اوسط فروخت قیمت', units_original_price: 'یونٹس @ اصل قیمت', units_discounted_price: 'یونٹس @ رعایتی قیمت',
    id: 'آئی ڈی', customer_label: 'کسٹمر', type_label: 'قسم', items: 'آئٹمز', units: 'یونٹس', paid: 'ادا شدہ', payment: 'ادائیگی', total: 'کل', total_label: 'کل:', count_label: 'گنتی',
    top_discounts_by_customer: 'کسٹمر کے لحاظ سے سب سے زیادہ رعایت', top_discounts_by_product: 'مصنوع کے لحاظ سے سب سے زیادہ رعایت', line_discount: 'لائن رعایت', header_discount: 'ہیڈر رعایت', total_discount: 'کل رعایت', walk_in: 'واک اِن',
    all_vendors: 'تمام ویینڈرز', all_products: 'تمام مصنوعات', total_cost: 'کل لاگت',
    // POS specific
    customer: 'کسٹمر',
    payment_method: 'ادائیگی کا طریقہ', payment: 'ادائیگی', amount_paid: 'ادا کی گئی رقم',
    paid_now_note: 'اب ادا کی گئی رقم اس فروخت کے خلاف ریکارڈ ہوگی۔',
    add_product: 'مصنوع شامل کریں', select_product: 'مصنوع منتخب کریں',
    scan_barcode: 'بارکوڈ اسکین کریں', sku: 'ایس کیو یو', focus_barcode: 'بارکوڈ پر فوکس', focus_product_search: 'مصنوع تلاش پر فوکس',
    unit_price: 'یونٹ قیمت', line_subtotal: 'لائن ذیلی کل', line_total: 'لائن کل',
    subtotal: 'ذیلی کل', balance: 'بقایا', remove: 'ہٹائیں',
    give_change: 'بقایا رقم', quick_tender: 'فوری ادائیگی', exact_cash: 'عین', clear: 'صاف کریں', checkout: 'چیک آؤٹ',
    park_resume_carts: 'ہولڈ / دوبارہ شروع کریں', hold_cart: 'ہولڈ', clear_cart: 'ہولڈز صاف کریں', no_held_carts: 'کوئی محفوظ کارٹس نہیں', cart: 'کارٹ',
    // Sales/Create misc
    new_sale: 'نئی فروخت', search_customer: 'کسٹمر تلاش کریں', create_new_customer_hint: 'یا نیا کسٹمر بنائیں (نام اور منفرد ای میل):', new_customer_name: 'نئے کسٹمر کا نام', new_customer_email: 'نئے کسٹمر کی ای میل', auto_create_customer_note: 'اگر آپ ڈراپ ڈاؤن خالی چھوڑیں اور یہ فیلڈز دیں، تو ہم محفوظی پر خودکار طور پر کسٹمر بنائیں گے اور منسلک کریں گے۔',
    add_products: 'مصنوعات شامل کریں', search_and_add_items_tip: 'تلاش کریں اور آئٹمز شامل کریں۔ مقدار دستیاب اسٹاک سے زیادہ نہیں ہوسکتی۔', search_by_name_or_sku: 'نام یا SKU سے تلاش کریں',
    discount: 'رعایت', amount: 'رقم', percent: 'فیصد', calculated: 'حساب شدہ',
    prefilled_pricing_rules_tip: 'پرائسنگ رولز سے پہلے سے بھرا گیا؛ آپ تبدیل کر سکتے ہیں۔', line_total_edit_tip: 'آپ اسے ایڈٹ کر سکتے ہیں؛ یونٹ قیمت = لائن کل / مقدار کے مطابق دوبارہ حساب ہوگی۔',
    status_label: 'حیثیت', grand_total: 'کل رقم',
    // Payment options
    card: 'کارڈ', mobile: 'موبائل', wallet: 'والیٹ', credit: 'کریڈٹ',
    // Reports (POS)
    pos_reports: 'پی او ایس رپورٹس', totals_by_payment_method: 'ادائیگی کے طریقہ کے لحاظ سے کل', totals_by_cashier: 'کیشئر کے لحاظ سے کل', cashier: 'کیشئر',
    unknown: 'نامعلوم', pos_disabled_redirecting: 'پی او ایس غیر فعال ہے۔ سیلز کی طرف بھیجا جا رہا ہے... ',

    // Products index
    search_products: 'مصنوعات تلاش کریں...', new_product: 'نئی مصنوعات', product_pricing: 'مصنوعات کی قیمتیں',
    selling_price_per_unit: 'فی یونٹ فروخت قیمت', stock: 'اسٹاک', purchasing_cost_per_unit_avg: 'فی یونٹ خریداری لاگت (اوسط)', avg_selling_price: 'اوسط فروخت قیمت',
    old_qty: 'پرانا عدد', new_qty: 'نیا عدد', current_qty: 'موجودہ عدد', actions: 'افعال',
    active: 'فعال', inactive: 'غیر فعال', view: 'دیکھیں', edit: 'ترمیم', delete: 'حذف کریں',
    cannot_delete_due_to_stock: 'حذف نہیں کیا جا سکتا کیونکہ اسٹاک موجود ہے۔ پہلے اسٹاک صفر کریں۔',
    cannot_delete_due_to_links: 'حذف نہیں کیا جا سکتا کیونکہ یہ مصنوع دیگر ریکارڈز سے منسلک ہے۔',
    cannot_delete: 'یہ مصنوع حذف نہیں کی جا سکتی۔',
    confirm_delete_product: 'کیا آپ اس مصنوع کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔',
    delete_disabled: 'حذف غیر فعال ہے',
    view_product_tip: 'مصنوع کی تفصیلات دیکھیں', edit_product_tip: 'اس مصنوع میں ترمیم کریں',
    // Generic list labels
    name: 'نام', email: 'ای میل', phone: 'فون', actions: 'افعال', type_label: 'قسم',
    new_vendor: 'نیا ویینڈر', create_new_vendor_tip: 'نیا ویینڈر بنائیں',
    edit_vendor_tip: 'اس ویینڈر میں ترمیم کریں', delete_vendor_tip: 'اس ویینڈر کو حذف کریں',
    create_new_category_tip: 'نئی کیٹیگری بنائیں', edit_category_tip: 'اس کیٹیگری میں ترمیم کریں', delete_category_tip: 'اس کیٹیگری کو حذف کریں',
    // Accounts
    account_code: 'اکاؤنٹ کوڈ', account_name: 'اکاؤنٹ نام', account_type: 'اکاؤنٹ قسم', status: 'حیثیت', open: 'کھلا', closed: 'بند', all: 'سب', search: 'تلاش', filter: 'فلٹر', view_history: 'ہسٹری دیکھیں', delete_account_confirm: 'کیا آپ اس اکاؤنٹ کو حذف کرنا چاہتے ہیں؟ صرف وہی اکاؤنٹ حذف ہوسکتا ہے جس میں جرنل اندراجات نہ ہوں۔',
    // Pagination and summaries
    page_of: (vars)=>`صفحہ ${vars?.current} از ${vars?.last}`,
    showing_from_to_of: (vars)=>`دکھایا جا رہا ہے ${vars?.from} - ${vars?.to} از ${vars?.total}`
  }
};

const I18nContext = createContext({ t: (k)=>k, locale: 'en', setLocale: ()=>{} });

export function I18nProvider({ initialLocale = 'en', children }) {
  const [locale, setLocaleState] = useState(initialLocale);
  const dict = dictionaries[locale] || dictionaries.en;

  const setLocale = (loc) => {
    setLocaleState(loc);
    router.post(route('language.switch', loc), {}, { preserveScroll: true, preserveState: true });
  };

  // Locale-aware formatting helpers
  const urduDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  const toUrduDigits = (str) => String(str).replace(/[0-9]/g, d => urduDigits[d] ?? d);

  const fmtNumber = (value, options = {}) => {
    try {
      const nf = new Intl.NumberFormat(locale === 'ur' ? 'ur-PK' : 'en-US', options);
      const out = nf.format(value);
      return locale === 'ur' ? toUrduDigits(out) : out;
    } catch {
      const out = Number(value).toLocaleString();
      return locale === 'ur' ? toUrduDigits(out) : out;
    }
  };

  const fmtCurrency = (value, currency = 'PKR', options = {}) => {
    return fmtNumber(value, { style: 'currency', currency, ...options });
  };

  const fmtDate = (value, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    try {
      const dt = value instanceof Date ? value : new Date(value);
      const df = new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-US', options);
      const out = df.format(dt);
      return locale === 'ur' ? toUrduDigits(out) : out;
    } catch {
      const out = String(value);
      return locale === 'ur' ? toUrduDigits(out) : out;
    }
  };

  const value = useMemo(()=>({
    locale,
    setLocale,
    t: (key) => dict[key] ?? key,
    helpText: (key) => getHelpText(locale, key),
    n: fmtNumber,
    currency: fmtCurrency,
    date: fmtDate,
    isRTL: locale === 'ur',
  }), [locale]);

  // Keep document language and direction in sync
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const lang = locale === 'ur' ? 'ur-PK' : 'en-US';
      document.documentElement.lang = lang;
      document.documentElement.dir = locale === 'ur' ? 'rtl' : 'ltr';
    }
  }, [locale]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}
