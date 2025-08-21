import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Currency from '@/Components/Currency';

export default function Dashboard({ kpis, recentJournals, ledgerBalances }) {
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
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Avg Sold Price</div><div className="text-2xl font-semibold"><Currency value={kpis.avgSoldPrice} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Units @ Original</div><div className="text-2xl font-semibold">{kpis.unitsOriginal ?? 0}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Units @ Discounted</div><div className="text-2xl font-semibold">{kpis.unitsDiscounted ?? 0}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Lent-Out Units</div><div className="text-2xl font-semibold">{kpis.lentOutTotal ?? 0}</div></div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Cash in Hand</div><div className="text-2xl font-semibold"><Currency value={kpis.cashInHand} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Bank Balance</div><div className="text-2xl font-semibold"><Currency value={kpis.bankBalance} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Receivables</div><div className="text-2xl font-semibold"><Currency value={kpis.receivables} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Payables</div><div className="text-2xl font-semibold"><Currency value={kpis.payables} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Net Profit (Month)</div><div className={`text-2xl font-semibold ${Number(kpis.netProfitMonth)>=0? 'text-emerald-600':'text-red-600'}`}><Currency value={kpis.netProfitMonth} /></div></div>
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
            <h3 className="mb-2 text-lg font-semibold">Recent Journal Entries</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left">Date</th>
                    <th className="px-2 py-2 text-left">Memo</th>
                    <th className="px-2 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJournals?.map(j => (
                    <tr key={j.id} className="border-t">
                      <td className="px-2 py-2">{j.date}</td>
                      <td className="px-2 py-2">{j.memo || '-'}</td>
                      <td className="px-2 py-2 text-right">
                        {route().has('reports.journals') && (
                          <Link href={route('reports.journals', { from: j.date, to: j.date })} className="text-indigo-600 hover:underline">View</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">Ledger Balances</h3>
            <div className="grid grid-cols-2 gap-4">
              {ledgerBalances.map((b, i)=> (
                <div key={i} className="rounded border p-3"><div className="text-sm text-gray-600">{b.currency}</div><div className="text-xl font-semibold"><Currency value={b.total} /></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
