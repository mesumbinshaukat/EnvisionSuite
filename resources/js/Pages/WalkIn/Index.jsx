import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Currency from '@/Components/Currency';

export default function WalkInIndex({ filters = {}, summary = {}, topProducts = [], topCategories = [], transactions = [] }) {
  const { data, setData, get, processing } = useForm({
    from: filters.from || '',
    to: filters.to || '',
  });

  const submit = (e) => {
    e.preventDefault();
    get(route('walkin.index'));
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Walk-in Customers</h2>}
    >
      <Head title="Walk-in Customers" />
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href={route('customers.ledger', 0)} className="text-indigo-600 hover:underline">View Walk-in Ledger →</Link>
          </div>
        </div>

        <form onSubmit={submit} className="rounded bg-white p-4 shadow space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm text-gray-600">From</label>
              <input type="date" value={data.from} onChange={(e)=>setData('from', e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <input type="date" value={data.to} onChange={(e)=>setData('to', e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={processing} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Apply</button>
            <Link href={route('walkin.index')} className="rounded border px-4 py-2">Reset</Link>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded bg-white p-4 shadow">
            <div className="text-xs uppercase text-gray-500">Sales Count</div>
            <div className="mt-1 text-2xl font-semibold">{summary.count || 0}</div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-xs uppercase text-gray-500">Total Sales</div>
            <div className="mt-1 text-2xl font-semibold"><Currency value={summary.total_sales || 0} /></div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-xs uppercase text-gray-500">Total Paid</div>
            <div className="mt-1 text-2xl font-semibold"><Currency value={summary.total_paid || 0} /></div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-xs uppercase text-gray-500">Outstanding</div>
            <div className={`mt-1 text-2xl font-semibold ${((summary.outstanding||0)>0)?'text-red-600':'text-green-600'}`}><Currency value={summary.outstanding || 0} /></div>
          </div>
        </div>

        <div className="rounded bg-white p-4 shadow overflow-x-auto">
          <div className="mb-3 text-lg font-semibold">Transactions</div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Description</th>
                <th className="px-2 py-1 text-right">Debit</th>
                <th className="px-2 py-1 text-right">Credit</th>
                <th className="px-2 py-1 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(!transactions || transactions.length===0) && (
                <tr><td colSpan={5} className="px-2 py-6 text-center text-gray-500">No transactions</td></tr>
              )}
              {transactions.map((t, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1 whitespace-nowrap">{t.date}</td>
                  <td className="px-2 py-1">{t.description}</td>
                  <td className="px-2 py-1 text-right">{t.debit ? <Currency value={t.debit} /> : ''}</td>
                  <td className="px-2 py-1 text-right">{t.credit ? <Currency value={t.credit} /> : ''}</td>
                  <td className="px-2 py-1 text-right font-medium"><Currency value={t.balance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded bg-white p-4 shadow overflow-x-auto">
            <div className="mb-3 text-lg font-semibold">Top Products</div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-1">Product</th>
                  <th className="px-2 py-1 text-right">Qty</th>
                  <th className="px-2 py-1 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 && (
                  <tr><td colSpan={3} className="px-2 py-6 text-center text-gray-500">No data</td></tr>
                )}
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{p.name}</td>
                    <td className="px-2 py-1 text-right">{p.qty}</td>
                    <td className="px-2 py-1 text-right"><Currency value={p.total} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded bg-white p-4 shadow overflow-x-auto">
            <div className="mb-3 text-lg font-semibold">Top Categories</div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-1">Category</th>
                  <th className="px-2 py-1 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topCategories.length === 0 && (
                  <tr><td colSpan={2} className="px-2 py-6 text-center text-gray-500">No data</td></tr>
                )}
                {topCategories.map((c, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{c.name}</td>
                    <td className="px-2 py-1 text-right"><Currency value={c.total} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
