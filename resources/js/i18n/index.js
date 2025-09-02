import React, { createContext, useContext, useMemo, useState } from 'react';
import { getHelpText } from '@/helpTexts';
import { router } from '@inertiajs/react';

const dictionaries = {
  en: {
    dashboard: 'Dashboard',
    sales: 'Sales', purchases: 'Purchases', inventory: 'Inventory', accounting: 'Accounting', reports: 'Reports', finance: 'Finance', admin: 'Admin',
    pos: 'POS', customers: 'Customers', customer_history: 'Customer History', walkin_customers: 'Walk-in Customers', pricing_rules: 'Pricing Rules',
    vendors: 'Vendors', expenses: 'Expenses', products: 'Products', categories: 'Categories', adjustments: 'Adjustments', inventory_loans: 'Inventory Loans',
    inventory_report: 'Inventory Report', avg_cost_report: 'Avg Cost Report', ledger: 'Ledger', journals: 'Journals', trial_balance: 'Trial Balance', profit_loss: 'Profit & Loss',
    sales_report: 'Sales Report', purchases_report: 'Purchases Report', finance_summary: 'Finance Summary', shops: 'Shops',
    search_placeholder: 'Search pages…', language: 'Language', english: 'English', urdu: 'Urdu'
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    sales: 'سیلز', purchases: 'خریداری', inventory: 'انوینٹری', accounting: 'اکاؤنٹنگ', reports: 'رپورٹس', finance: 'فائنانس', admin: 'ایڈمن',
    pos: 'پی او ایس', customers: 'کسٹمرز', customer_history: 'کسٹمر ہسٹری', walkin_customers: 'واک اِن کسٹمرز', pricing_rules: 'پرائسنگ رولز',
    vendors: 'ویینڈرز', expenses: 'اخراجات', products: 'مصنوعات', categories: 'کیٹیگریز', adjustments: 'ایڈجسمنٹس', inventory_loans: 'انوینٹری لونز',
    inventory_report: 'انوینٹری رپورٹ', avg_cost_report: 'اوسط لاگت رپورٹ', ledger: 'لیجر', journals: 'جرنلز', trial_balance: 'ٹرائل بیلنس', profit_loss: 'منافع و نقصان',
    sales_report: 'سیلز رپورٹ', purchases_report: 'پرچیزز رپورٹ', finance_summary: 'فائنانس سمری', shops: 'شاپس',
    search_placeholder: 'صفحات تلاش کریں…', language: 'زبان', english: 'انگریزی', urdu: 'اردو'
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

  const value = useMemo(()=>({
    locale,
    setLocale,
    t: (key) => dict[key] ?? key,
    helpText: (key) => getHelpText(locale, key),
  }), [locale]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}
