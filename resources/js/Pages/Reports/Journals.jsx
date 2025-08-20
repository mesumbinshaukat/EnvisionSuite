import React from 'react';
import Tooltip from '@/Components/Tooltip';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';

export default function Journals({ auth, filters, entries }) {
  const { data, setData, get, processing } = useForm({ from: filters.from, to: filters.to });
  const submit = (e) => { e.preventDefault(); get(route('reports.accounting.journals'), { preserveState: true }); };
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Journals" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">Journals
            <Tooltip text={"Shows all journal entries within the selected date range. Each row displays a journal line with its account and debit/credit amounts."} />
          </h1>
          <Link href={route('reports.accounting.journals.export', data)} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Export Excel</Link>
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
                <th className="px-4 py-2 text-left">Date <Tooltip text={"Journal entry date."} /></th>
                <th className="px-4 py-2 text-left">Memo <Tooltip text={"Short description for the journal entry."} /></th>
                <th className="px-4 py-2 text-left">Account <Tooltip text={"Account code and name affected by this line."} /></th>
                <th className="px-4 py-2 text-right">Debit <Tooltip text={"Debit amount posted to the account."} /></th>
                <th className="px-4 py-2 text-right">Credit <Tooltip text={"Credit amount posted to the account."} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.data.flatMap(e => e.lines.map((l, idx) => (
                <tr key={`${e.id}-${idx}`}>
                  <td className="px-4 py-2">{e.date}</td>
                  <td className="px-4 py-2">{e.memo || '-'}</td>
                  <td className="px-4 py-2">{l.account ? `${l.account.code} ${l.account.name}` : '-'}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(l.debit || 0))}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(l.credit || 0))}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500">Page {entries.current_page} of {entries.last_page}</div>
      </div>
    </AuthenticatedLayout>
  );
}
