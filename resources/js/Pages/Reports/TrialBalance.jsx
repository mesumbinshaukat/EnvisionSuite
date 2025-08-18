import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';

export default function TrialBalance({ auth, filters, rows, totals }) {
  const { data, setData, get, processing } = useForm({ from: filters.from, to: filters.to });
  const submit = (e) => { e.preventDefault(); get(route('reports.accounting.trialBalance'), { preserveState: true }); };
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Trial Balance" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Trial Balance</h1>
          <Link href={route('reports.accounting.trialBalance.export', data)} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Export Excel</Link>
        </div>
        <form onSubmit={submit} className="bg-white shadow rounded p-4 grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm">From</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">To</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={processing}>Apply</button>
          </div>
        </form>
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Account</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right">Debit</th>
                <th className="px-4 py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2">{r.code}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.type}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(r.debit || 0))}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(r.credit || 0))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-4 py-2 text-right font-medium">Totals</td>
                <td className="px-4 py-2 text-right font-medium">{formatPKR(Number(totals.debit || 0))}</td>
                <td className="px-4 py-2 text-right font-medium">{formatPKR(Number(totals.credit || 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
