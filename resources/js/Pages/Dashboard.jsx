import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ kpis, lowStock, ledgerBalances }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dashboard</h2>}>
      <Head title="Dashboard" />
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Sales Today</div><div className="text-2xl font-semibold">{kpis.salesToday}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Sales This Month</div><div className="text-2xl font-semibold">{kpis.salesMonth}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Orders</div><div className="text-2xl font-semibold">{kpis.ordersCount}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Products</div><div className="text-2xl font-semibold">{kpis.productsCount}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Ledger Accounts</div><div className="text-2xl font-semibold">{kpis.ledgerAccounts}</div></div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Avg Sold Price</div><div className="text-2xl font-semibold">{Number(kpis.avgSoldPrice ?? 0).toFixed(2)}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Units @ Original</div><div className="text-2xl font-semibold">{kpis.unitsOriginal ?? 0}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Units @ Discounted</div><div className="text-2xl font-semibold">{kpis.unitsDiscounted ?? 0}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Lent-Out Units</div><div className="text-2xl font-semibold">{kpis.lentOutTotal ?? 0}</div></div>
        </div>

        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 text-lg font-semibold">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link href={route().has('inventory.loans.index') ? route('inventory.loans.index') : '#'} className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Inventory Loans</Link>
            <Link href={route().has('inventory.loans.create') ? route('inventory.loans.create') : '#'} className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">New Loan</Link>
            <Link href={route().has('reports.sales') ? route('reports.sales') : '#'} className="inline-flex items-center rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800">Sales Report</Link>
            <Link href={route().has('reports.inventory') ? route('reports.inventory') : '#'} className="inline-flex items-center rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800">Inventory Report</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">Low Stock</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead><tr><th className="px-2 py-2 text-left">Product</th><th className="px-2 py-2">SKU</th><th className="px-2 py-2 text-right">Stock</th></tr></thead>
                <tbody>
                  {lowStock.map(p=> (
                    <tr key={p.id} className="border-t"><td className="px-2 py-2">{p.name}</td><td className="px-2 py-2">{p.sku}</td><td className="px-2 py-2 text-right">{p.stock}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">Ledger Balances</h3>
            <div className="grid grid-cols-2 gap-4">
              {ledgerBalances.map((b, i)=> (
                <div key={i} className="rounded border p-3"><div className="text-sm text-gray-600">{b.currency}</div><div className="text-xl font-semibold">{b.total}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
