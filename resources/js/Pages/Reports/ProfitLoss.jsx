import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';

export default function ProfitLoss({ auth, filters, revenue, expense, profit, rows }) {
  const { data, setData, get, processing } = useForm({ from: filters.from, to: filters.to });
  const submit = (e) => { e.preventDefault(); get(route('reports.accounting.profitLoss'), { preserveState: true }); };
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Profit & Loss" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Profit &amp; Loss</h1>
          <Link href={route('reports.accounting.profitLoss.export', data)} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Export Excel</Link>
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

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-2xl font-semibold">{formatPKR(Number(revenue||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Expenses</div>
            <div className="text-2xl font-semibold">{formatPKR(Number(expense||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Net Profit</div>
            <div className={`text-2xl font-semibold ${Number(profit)>=0? 'text-emerald-600':'text-red-600'}`}>{formatPKR(Number(profit||0))}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded overflow-x-auto">
            <div className="px-4 py-2 font-medium">Revenue Accounts</div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Code</th><th className="px-4 py-2 text-left">Account</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {rows.revenue.map((r, idx) => (
                  <tr key={idx}><td className="px-4 py-2">{r.code}</td><td className="px-4 py-2">{r.name}</td><td className="px-4 py-2 text-right">{formatPKR(Number(r.credit - r.debit))}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white shadow rounded overflow-x-auto">
            <div className="px-4 py-2 font-medium">Expense Accounts</div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Code</th><th className="px-4 py-2 text-left">Account</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {rows.expense.map((r, idx) => (
                  <tr key={idx}><td className="px-4 py-2">{r.code}</td><td className="px-4 py-2">{r.name}</td><td className="px-4 py-2 text-right">{formatPKR(Number(r.debit - r.credit))}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
   