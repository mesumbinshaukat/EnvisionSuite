import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
    money_loans: 'Money Loans', new_money_loan: 'New Money Loan', record_money_loan: 'Record Money Loan',
    equity_dashboard: 'Equity & Store Worth', assets: 'Assets', liabilities: 'Liabilities', net_worth: 'Net Worth',
    store_worth: 'Store Worth (Assets - Liabilities)', net_cash_after_liabilities: 'Net Cash after Liabilities',
    average_sales: 'Average Sales', avg_daily: 'Avg Daily', avg_weekly: 'Avg Weekly', avg_monthly: 'Avg Monthly',
    assets_breakdown: 'Assets Breakdown', net_overview: 'Net Overview', price_increase_trend: 'Price Increase Trend',
    vendor_price_comparison: 'Vendor Price Comparison', probability_high_sales: 'Probability of Higher Sales',
    inventory_value: 'Inventory', bank_balance: 'Bank', cash_balance: 'Cash', receivables: 'Receivables', payables: 'Payables',
    counterparty_type: 'Counterparty Type', vendor: 'Vendor', external_person: 'External Person',
    direction: 'Direction', lend: 'Lend (we give)', borrow: 'Borrow (we take)',
    source: 'Source', cash: 'Cash', bank: 'Bank', amount: 'Amount', date: 'Date', note: 'Note',
    save: 'Save', cancel: 'Cancel', back: 'Back',
    search_placeholder: 'Search pages…', language: 'Language', english: 'English', urdu: 'Urdu'
  },
  ur: {
    dashboard: 'ڈیش بورڈ',
    sales: 'سیلز', purchases: 'خریداری', inventory: 'انوینٹری', accounting: 'اکاؤنٹنگ', reports: 'رپورٹس', finance: 'فائنانس', admin: 'ایڈمن',
    pos: 'پی او ایس', customers: 'کسٹمرز', customer_history: 'کسٹمر ہسٹری', walkin_customers: 'واک اِن کسٹمرز', pricing_rules: 'پرائسنگ رولز',
    vendors: 'ویینڈرز', expenses: 'اخراجات', products: 'مصنوعات', categories: 'کیٹیگریز', adjustments: 'ایڈجسمنٹس', inventory_loans: 'انوینٹری لونز',
    inventory_report: 'انوینٹری رپورٹ', avg_cost_report: 'اوسط لاگت رپورٹ', ledger: 'لیجر', journals: 'جرنلز', trial_balance: 'ٹرائل بیلنس', profit_loss: 'منافع و نقصان',
    sales_report: 'سیلز رپورٹ', purchases_report: 'پرچیزز رپورٹ', finance_summary: 'فائنانس سمری', shops: 'شاپس',
    money_loans: 'رقمی قرضے', new_money_loan: 'نیا رقمی قرضہ', record_money_loan: 'رقمی قرضہ درج کریں',
    equity_dashboard: 'ایکویٹی اور دکان کی مالیت', assets: 'اثاثے', liabilities: 'ذمہ داریاں', net_worth: 'خالص مالیت',
    store_worth: 'دکان کی مالیت (اثاثے - ذمہ داریاں)', net_cash_after_liabilities: 'ذمہ داریوں کے بعد خالص نقد',
    average_sales: 'اوسط فروخت', avg_daily: 'اوسط روزانہ', avg_weekly: 'اوسط ہفتہ وار', avg_monthly: 'اوسط ماہانہ',
    assets_breakdown: 'اثاثوں کی تقسیم', net_overview: 'خلاصہ نیٹ', price_increase_trend: 'قیمتوں میں اضافہ رجحان',
    vendor_price_comparison: 'ویینڈر قیمت موازنہ', probability_high_sales: 'زیادہ فروخت کے امکانات',
    inventory_value: 'انوینٹری', bank_balance: 'بینک', cash_balance: 'نقد', receivables: 'وصولیاں', payables: 'ادائگیاں',
    counterparty_type: 'فریق کی قسم', vendor: 'ویینڈر', external_person: 'باہر کا شخص',
    direction: 'سمت', lend: 'قرض دینا (ہم دیں)', borrow: 'قرض لینا (ہم لیں)',
    source: 'ذریعہ', cash: 'نقد', bank: 'بینک', amount: 'رقم', date: 'تاریخ', note: 'نوٹ',
    save: 'محفوظ کریں', cancel: 'منسوخ کریں', back: 'واپس',
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
