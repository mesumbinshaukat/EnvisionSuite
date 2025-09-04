import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Currency from '@/Components/Currency';

export default function Summary({ filters = {}, balances = {}, vendorPayments = {} }) {
  const { data, setData, get, processing } = useForm({
    from: filters.from || '',
    to: filters.to || '',
  });

  const submit = (e) => {
    e.preventDefault();
    get(route('finance.summary'));
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Finance Summary</h2>}>
      <Head title="Finance Summary" />
      <div className="mx-auto max-w-6xl p-6 space-y-6">
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
            <div className="flex items-end">
              <button disabled={processing} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Apply</button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-500">Cash in Hand (1000)</div>
            <div className="text-2xl font-semibold"><Currency value={balances.cash || 0} /></div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-500">Bank Balance (1010)</div>
            <div className="text-2xl font-semibold"><Currency value={balances.bank || 0} /></div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-500">Total Liquidity</div>
            <div className="text-2xl font-semibold"><Currency value={balances.total || 0} /></div>
          </div>
        </div>

        <div className="rounded bg-white p-4 shadow">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-lg font-semibold">Vendor Payments</div>
            <div className="text-sm text-gray-500">Total: <Currency value={vendorPayments.total || 0} /></div>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-2">Method</th>
                <th className="px-2 py-2 text-right">Count</th>
                <th className="px-2 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(vendorPayments.byMethod || []).length === 0 && (<tr><td className="px-2 py-4 text-center text-gray-500" colSpan={3}>No data</td></tr>)}
              {(vendorPayments.byMethod || []).map((m, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-2 capitalize">{m.method}</td>
                  <td className="px-2 py-2 text-right">{m.count}</td>
                  <td className="px-2 py-2 text-right"><Currency value={m.total} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
