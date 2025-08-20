import React from 'react';
import Tooltip from '@/Components/Tooltip';
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
          <h1 className="text-xl font-semibold flex items-center gap-2">Profit &amp; Loss
            <Tooltip text={"Shows Revenue minus all Expenses including computed COGS (purchase taxes/charges allocated). Period is based on From/To dates."}>
              i
            </Tooltip>
          </h1>
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
            <div className="text-sm text-gray-500 flex items-center gap-2">Revenue
              <Tooltip text={"Sum of credit balances for revenue accounts within the selected period."} />
            </div>
            <div className="text-2xl font-semibold">{formatPKR(Number(revenue||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500 flex items-center gap-2">Expenses
              <Tooltip text={"All expense accounts (debits) plus computed COGS from purchases, allocated per unit."} />
            </div>
            <div className="text-2xl font-semibold">{formatPKR(Number(expense||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500 flex items-center gap-2">Net Profit
              <Tooltip text={"Net Profit = Revenue - (Expenses + COGS)."} />
            </div>
            <div className={`text-2xl font-semibold ${Number(profit)>=0? 'text-emerald-600':'text-red-600'}`}>{formatPKR(Number(profit||0))}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded overflow-x-auto">
            <div className="px-4 py-2 font-medium flex items-center gap-2">Revenue Accounts
              <Tooltip text={"Each revenue account shows net credit (credit - debit) over the selected period."} />
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Account</th>
                <th className="px-4 py-2 text-right">Amount <Tooltip text={"Net credit balance for the account in this period."} /></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {rows.revenue.map((r, idx) => (
                  <tr key={idx}><td className="px-4 py-2">{r.code}</td><td className="px-4 py-2">{r.name}</td><td className="px-4 py-2 text-right">{formatPKR(Number(r.credit - r.debit))}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white shadow rounded overflow-x-auto">
            <div className="px-4 py-2 font-medium flex items-center gap-2">Expense Accounts
              <Tooltip text={"Each expense account shows net debit (debit - credit) over the selected period. COGS is appended as a computed expense."} />
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Account</th>
                <th className="px-4 py-2 text-right">Amount <Tooltip text={"Net debit balance for the account in this period."} /></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {rows.expense.map((r, idx) => (
                  <tr key={idx}><td className="px-4 py-2">{r.code}</td><td className="px-4 py-2">{r.name}</td><td className="px-4 py-2 text-right">{formatPKR(Number(r.debit - r.credit))}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
