import React, { useMemo } from 'react';
import Tooltip from '@/Components/Tooltip';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';
// Charts removed per request

export default function Journals({ auth, filters, entries, aggregates }) {
  const initialScope = (!filters.scope || filters.scope === 'all') ? 'revenue' : filters.scope;
  const { data, setData, get, processing } = useForm({ from: filters.from, to: filters.to, scope: initialScope, account: '' });
  const submit = (e) => {
    e.preventDefault();
    const params = { from: data.from, to: data.to };
    const scopeValue = data.account?.trim() ? `account:${data.account.trim()}` : data.scope;
    get(route('reports.accounting.journals', { ...params, scope: scopeValue }), { preserveState: true });
  };

  // Charts removed

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Journals" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">Journals
            <Tooltip text={"Shows all journal entries within the selected date range. Each row displays a journal line with its account and debit/credit amounts."} />
          </h1>
          <Link href={route('reports.accounting.journals.export', { from: data.from, to: data.to, scope: (data.account?.trim() ? `account:${data.account.trim()}` : data.scope) })} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Export Excel</Link>
        </div>
        <form onSubmit={submit} className="bg-white shadow rounded p-4 grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm">From</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">To</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Scope <Tooltip text={"Filter series and aggregates. For meaningful debit vs credit differences, choose Revenue, Expense, Assets, Liabilities, or a specific account code."} /></label>
            <select className="mt-1 w-full border-gray-300 rounded" value={data.scope} onChange={e=>setData('scope', e.target.value)}>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="assets">Assets</option>
              <option value="liabilities">Liabilities</option>
              <option value="all">All (Totals equal by design)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Account Code <Tooltip text={"Optional. When provided, overrides scope to focus on a single account (e.g., 4000)."} /></label>
            <input type="text" placeholder="e.g., 4000" className="mt-1 w-full border-gray-300 rounded" value={data.account} onChange={e=>setData('account', e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={processing}>Apply</button>
          </div>
        </form>

        {data.scope === 'all' && !data.account?.trim() && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            Note: With scope = All, double-entry bookkeeping makes total debits equal total credits. Select a specific scope (e.g., Revenue or Expense) or enter an Account Code to see differentiated charts.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Total Debit <Tooltip text={"Sum of all debits within range."} /></div>
            <div className="text-xl font-semibold">{formatPKR(Number(aggregates?.totals?.debit || 0))}</div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Total Credit <Tooltip text={"Sum of all credits within range."} /></div>
            <div className="text-xl font-semibold">{formatPKR(Number(aggregates?.totals?.credit || 0))}</div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Lines <Tooltip text={"Total journal lines counted."} /></div>
            <div className="text-xl font-semibold">{aggregates?.totals?.lines || 0}</div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Avg Daily Debit <Tooltip text={"Average debit per day over selected period."} /></div>
            <div className="text-xl font-semibold">{formatPKR(Number(aggregates?.averages?.daily?.debit || 0))}</div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Avg Weekly Credit <Tooltip text={"Average credit per week over selected period."} /></div>
            <div className="text-xl font-semibold">{formatPKR(Number(aggregates?.averages?.weekly?.credit || 0))}</div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Avg Monthly Debit <Tooltip text={"Average debit per month over selected period."} /></div>
            <div className="text-xl font-semibold">{formatPKR(Number(aggregates?.averages?.monthly?.debit || 0))}</div>
          </div>
        </div>

        {/* Charts removed */}

        {/* Top Accounts */}
        <div className="bg-white shadow rounded overflow-x-auto">
          <div className="px-4 py-2 font-medium flex items-center gap-2">Top Accounts by Activity <Tooltip text={"Top accounts by highest debit/credit totals in range."} /></div>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-2 text-left">Account</th>
              <th className="px-4 py-2 text-right">Debit</th>
              <th className="px-4 py-2 text-right">Credit</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {(aggregates?.topAccounts ?? []).map((a, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{a.code} {a.name}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(a.debit_sum || 0))}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(a.credit_sum || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
