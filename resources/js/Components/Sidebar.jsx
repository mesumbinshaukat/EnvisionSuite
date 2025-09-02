import { useMemo, useState } from 'react';

export default function Sidebar() {
  const groups = useMemo(() => ([
    { key: 'dashboard', label: 'Dashboard', items: [{ label: 'Dashboard', href: route('dashboard'), active: route().current('dashboard') }]},
    { key: 'sales', label: 'Sales', items: [
      { label: 'POS', href: route('pos.index'), active: route().current('pos.index') },
      { label: 'Sales', href: route('sales.index'), active: route().current('sales.*') },
      { label: 'Customers', href: route('customers.index'), active: route().current('customers.index') },
      { label: 'Customer History', href: route().has('customers.history') ? route('customers.history') : '#', active: route().current('customers.history') },
      { label: 'Walk-in Customers', href: route().has('walkin.index') ? route('walkin.index') : '#', active: route().current('walkin.index') },
      { label: 'Pricing Rules', href: route().has('pricing.index') ? route('pricing.index') : '#', active: route().current('pricing.*') },
    ] },
    { key: 'purchases', label: 'Purchases', items: [
      { label: 'Vendors', href: route().has('vendors.index') ? route('vendors.index') : '#', active: route().current('vendors.*') },
      { label: 'Purchases', href: route().has('purchases.index') ? route('purchases.index') : '#', active: route().current('purchases.*') },
      { label: 'Expenses', href: route().has('expenses.index') ? route('expenses.index') : '#', active: route().current('expenses.*') },
    ] },
    { key: 'inventory', label: 'Inventory', items: [
      { label: 'Products', href: route('products.index'), active: route().current('products.*') },
      { label: 'Categories', href: route().has('categories.index') ? route('categories.index') : '#', active: route().current('categories.*') },
      { label: 'Adjustments', href: route().has('inventory.adjustments.index') ? route('inventory.adjustments.index') : '#', active: route().current('inventory.adjustments.*') },
      { label: 'Inventory Loans', href: route().has('inventory.loans.index') ? route('inventory.loans.index') : '#', active: route().current('inventory.loans.*') },
      { label: 'Inventory Report', href: route().has('reports.inventory') ? route('reports.inventory') : '#', active: route().current('reports.inventory') },
      { label: 'Avg Cost Report', href: route().has('reports.inventoryAverage') ? route('reports.inventoryAverage') : '#', active: route().current('reports.inventoryAverage') },
    ] },
    { key: 'accounting', label: 'Accounting', items: [
      { label: 'Ledger', href: route('ledger.index'), active: route().current('ledger.index') },
      { label: 'Journals', href: route().has('reports.accounting.journals') ? route('reports.accounting.journals') : '#', active: route().current('reports.accounting.journals') },
      { label: 'Trial Balance', href: route().has('reports.accounting.trialBalance') ? route('reports.accounting.trialBalance') : '#', active: route().current('reports.accounting.trialBalance') },
      { label: 'Profit & Loss', href: route().has('reports.accounting.profitLoss') ? route('reports.accounting.profitLoss') : '#', active: route().current('reports.accounting.profitLoss') },
    ] },
    { key: 'reports', label: 'Reports', items: [
      { label: 'Sales Report', href: route().has('reports.sales') ? route('reports.sales') : '#', active: route().current('reports.sales') },
      { label: 'Purchases Report', href: route().has('reports.purchases') ? route('reports.purchases') : '#', active: route().current('reports.purchases') },
      { label: 'POS Report', href: route().has('reports.pos') ? route('reports.pos') : '#', active: route().current('reports.pos') },
    ] },
    { key: 'finance', label: 'Finance', items: [
      { label: 'Finance Summary', href: route().has('finance.summary') ? route('finance.summary') : '#', active: route().current('finance.summary') },
    ] },
    { key: 'admin', label: 'Admin', items: [
      { label: 'Shops', href: route().has('shops.index') ? route('shops.index') : '#', active: route().current('shops.index') },
    ] },
  ]), []);

  const [collapsed, setCollapsed] = useState(false);

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
            <div className={`px-2 text-xs font-semibold uppercase text-gray-500 ${collapsed ? 'hidden' : 'block'}`}>{g.label}</div>
            <ul className="mt-1 space-y-1">
              {g.items.map((it, idx)=> (
                <li key={idx}>
                  <a href={it.href} className={`flex items-center gap-2 rounded px-2 py-2 text-sm ${it.active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <span className={`${collapsed ? 'hidden' : 'inline'}`}>{it.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
