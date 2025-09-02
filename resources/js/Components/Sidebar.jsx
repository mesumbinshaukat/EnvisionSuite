import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';

export default function Sidebar() {
  const { t } = useI18n();
  const groups = useMemo(() => ([
    { key: 'dashboard', labelKey: 'dashboard', items: [{ labelKey: 'dashboard', href: route('dashboard'), active: route().current('dashboard') }]},
    { key: 'sales', labelKey: 'sales', items: [
      { labelKey: 'pos', href: route('pos.index'), active: route().current('pos.index') },
      { labelKey: 'sales', href: route('sales.index'), active: route().current('sales.*') },
      { labelKey: 'customers', href: route('customers.index'), active: route().current('customers.index') },
      { labelKey: 'customer_history', href: route().has('customers.history') ? route('customers.history') : '#', active: route().current('customers.history') },
      { labelKey: 'walkin_customers', href: route().has('walkin.index') ? route('walkin.index') : '#', active: route().current('walkin.index') },
      { labelKey: 'pricing_rules', href: route().has('pricing.index') ? route('pricing.index') : '#', active: route().current('pricing.*') },
    ] },
    { key: 'purchases', labelKey: 'purchases', items: [
      { labelKey: 'vendors', href: route().has('vendors.index') ? route('vendors.index') : '#', active: route().current('vendors.*') },
      { labelKey: 'purchases', href: route().has('purchases.index') ? route('purchases.index') : '#', active: route().current('purchases.*') },
      { labelKey: 'expenses', href: route().has('expenses.index') ? route('expenses.index') : '#', active: route().current('expenses.*') },
    ] },
    { key: 'inventory', labelKey: 'inventory', items: [
      { labelKey: 'products', href: route('products.index'), active: route().current('products.*') },
      { labelKey: 'categories', href: route().has('categories.index') ? route('categories.index') : '#', active: route().current('categories.*') },
      { labelKey: 'adjustments', href: route().has('inventory.adjustments.index') ? route('inventory.adjustments.index') : '#', active: route().current('inventory.adjustments.*') },
      { labelKey: 'inventory_loans', href: route().has('inventory.loans.index') ? route('inventory.loans.index') : '#', active: route().current('inventory.loans.*') },
      { labelKey: 'inventory_report', href: route().has('reports.inventory') ? route('reports.inventory') : '#', active: route().current('reports.inventory') },
      { labelKey: 'avg_cost_report', href: route().has('reports.inventoryAverage') ? route('reports.inventoryAverage') : '#', active: route().current('reports.inventoryAverage') },
    ] },
    { key: 'accounting', labelKey: 'accounting', items: [
      { labelKey: 'ledger', href: route('ledger.index'), active: route().current('ledger.index') },
      { labelKey: 'journals', href: route().has('reports.accounting.journals') ? route('reports.accounting.journals') : '#', active: route().current('reports.accounting.journals') },
      { labelKey: 'trial_balance', href: route().has('reports.accounting.trialBalance') ? route('reports.accounting.trialBalance') : '#', active: route().current('reports.accounting.trialBalance') },
      { labelKey: 'profit_loss', href: route().has('reports.accounting.profitLoss') ? route('reports.accounting.profitLoss') : '#', active: route().current('reports.accounting.profitLoss') },
    ] },
    { key: 'reports', labelKey: 'reports', items: [
      { labelKey: 'sales_report', href: route().has('reports.sales') ? route('reports.sales') : '#', active: route().current('reports.sales') },
      { labelKey: 'purchases_report', href: route().has('reports.purchases') ? route('reports.purchases') : '#', active: route().current('reports.purchases') },
      { labelKey: 'pos', href: route().has('reports.pos') ? route('reports.pos') : '#', active: route().current('reports.pos') },
    ] },
    { key: 'finance', labelKey: 'finance', items: [
      { labelKey: 'finance_summary', href: route('finance.summary'), active: route().current('finance.summary') },
      { labelKey: 'equity_dashboard', href: route().has('finance.equity') ? route('finance.equity') : '#', active: route().current('finance.equity') },
      { labelKey: 'money_loans', href: route().has('money.loans.index') ? route('money.loans.index') : '#', active: route().current('money.loans.*') },
    ] },
    { key: 'admin', labelKey: 'admin', items: [
      { labelKey: 'shops', href: route().has('shops.index') ? route('shops.index') : '#', active: route().current('shops.index') },
    ] },
  ]), []);

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({ sales: true, purchases: true, inventory: true, accounting: true, reports: true, finance: true, admin: true, dashboard: true });
  const toggleGroup = (key) => setOpenGroups(s => ({ ...s, [key]: !s[key] }));

  return (
    <aside className={`bg-white border-r border-gray-200 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto z-40`}
      aria-label="Sidebar">
      <div className="p-2 flex items-center justify-between">
        <button onClick={()=> setCollapsed(c => !c)} className="rounded p-2 text-gray-600 hover:bg-gray-100" aria-label="Toggle sidebar">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 5h14v2H3V5zm0 4h10v2H3V9zm0 4h14v2H3v-2z"/></svg>
        </button>
      </div>
      <nav className="px-2 pb-4">
        {groups.map(g => (
          <div key={g.key} className="mb-2">
            <button type="button" onClick={()=> toggleGroup(g.key)} className={`w-full flex items-center justify-between px-2 py-2 rounded ${collapsed ? 'hidden' : 'flex'} hover:bg-gray-50`} aria-expanded={!!openGroups[g.key]}>
              <span className="text-xs font-semibold uppercase text-gray-600">{t(g.labelKey)}</span>
              <svg className={`h-4 w-4 text-gray-500 transition-transform ${openGroups[g.key] ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M7 5l6 5-6 5V5z"/></svg>
            </button>
            {openGroups[g.key] && (
              <ul className="mt-1 space-y-1">
                {g.items.map((it, idx)=> (
                  <li key={idx}>
                    <a href={it.href} className={`flex items-center gap-2 rounded px-2 py-2 text-sm ${it.active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span className={`${collapsed ? 'hidden' : 'inline'}`}>{t(it.labelKey)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
