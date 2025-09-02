import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Currency from '@/Components/Currency';

export default function History({ filters = {}, rows = [] }) {
  const { data, setData, get, processing } = useForm({
    from: filters.from || '',
    to: filters.to || '',
  });

  const submit = (e) => {
    e.preventDefault();
    get(route('customers.history'));
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Customer History</h2>}
    >
      <Head title="Customer History" />
      <div className="mx-auto max-w-7xl p-6 space-y-6">
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
            <Link href={route('customers.history')} className="rounded border px-4 py-2">Reset</Link>
          </div>
        </form>

        <div className="rounded bg-white p-4 shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2 text-right">Sales Count</th>
                <th className="px-2 py-2 text-right">Total Sales</th>
                <th className="px-2 py-2 text-right">Total Receipts</th>
                <th className="px-2 py-2 text-right">Outstanding</th>
                <th className="px-2 py-2">Last Activity</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-2 py-6 text-center text-gray-500">No data</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-2">{r.name}</td>
                  <td className="px-2 py-2 text-right">{r.sales_count}</td>
                  <td className="px-2 py-2 text-right"><Currency value={r.total_sales} /></td>
                  <td className="px-2 py-2 text-right"><Currency value={r.total_receipts} /></td>
                  <td className={`px-2 py-2 text-right ${r.outstanding>0 ? 'text-red-600' : ''}`}><Currency value={r.outstanding} /></td>
                  <td className="px-2 py-2">{r.last_activity || '-'}</td>
                  <td className="px-2 py-2">
                    {r.customer_id ? (
                      <Link href={route('customers.ledger', r.customer_id)} className="text-indigo-600 hover:underline">View Ledger</Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
