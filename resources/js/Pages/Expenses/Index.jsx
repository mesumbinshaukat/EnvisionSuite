import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Tooltip from '@/Components/Tooltip';
import { formatPKR } from '@/lib/currency';

export default function Index({ auth, filters, expenses, total }) {
  const { get, data, setData } = useForm({ from: filters.from, to: filters.to });
  const submit = (e) => { e.preventDefault(); get(route('expenses.index'), { preserveState: true }); };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Expenses" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">Expenses <Tooltip text={"Record business expenses. Amount in PKR (Rs)."} /></h1>
          <Link href={route('expenses.create')} className="px-3 py-2 bg-blue-600 text-white rounded">Add Expense</Link>
        </div>

        <form onSubmit={submit} className="flex gap-2 items-end">
          <div>
            <label className="block text-sm text-gray-600 flex items-center gap-2">From <Tooltip text={"Start date"} /></label>
            <input type="date" className="border rounded px-3 py-2" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 flex items-center gap-2">To <Tooltip text={"End date"} /></label>
            <input type="date" className="border rounded px-3 py-2" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Apply</button>
        </form>

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Date <Tooltip text={"Expense date"} /></th>
                <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Amount (PKR) <Tooltip text={"Amount in Pakistani Rupees (Rs)"} /></th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Payment <Tooltip text={"cash/card/bank transfer/credited"} /></th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Notes <Tooltip text={"Optional note"} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(expenses.data || []).map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(e.amount))}</td>
                  <td className="px-4 py-2">{e.payment_method.replace('_',' ')}</td>
                  <td className="px-4 py-2">{e.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 text-right font-semibold">Total: {formatPKR(Number(total))}</div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
