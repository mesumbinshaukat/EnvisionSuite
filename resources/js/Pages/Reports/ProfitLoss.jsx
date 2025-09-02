import React from 'react';
import Tooltip from '@/Components/Tooltip';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';

export default function ProfitLoss({ auth, filters, revenue, expense, profit, rows, cogs, grossProfit, grossMarginPct, operatingExpense, series = [], compare = {}, bucket = 'daily', top = { products: [], customers: [] } }) {
  const { data, setData, get, processing } = useForm({ from: filters.from, to: filters.to, bucket });
  // Simple inline SVG line generator for trends without extra deps
  const buildPath = (key, width=600, height=120, pad=8) => {
    if (!series || series.length === 0) return '';
    const values = series.map(s => Number(s[key]||0));
    const max = Math.max(1, ...values);
    const min = Math.min(0, ...values);
    const span = (max - min) || 1;
    const step = (width - pad*2) / Math.max(1, series.length - 1);
    const pts = values.map((v, i) => {
      const x = pad + i * step;
      const y = pad + (height - pad*2) * (1 - (v - min) / span);
      return `${i===0? 'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return pts.join(' ');
  };
  const sum = (arr, k) => (arr||[]).reduce((t, x) => t + Number(x[k]||0), 0);
  const fmtPct = (v) => v === null || v === undefined ? '-' : `${(v*100).toFixed(1)}%`;
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

        {/* Trends */}
        <div className="bg-white p-4 rounded shadow">
          <div className="px-1 pb-3 font-medium">Trends over time</div>
          <div className="overflow-x-auto">
            <svg width="800" height="160" className="min-w-[800px]">
              <path d={buildPath('revenue', 800, 140)} stroke="#059669" strokeWidth="2" fill="none" />
              <path d={buildPath('expense', 800, 140)} stroke="#ef4444" strokeWidth="2" fill="none" />
              <path d={buildPath('cogs', 800, 140)} stroke="#f59e0b" strokeWidth="2" fill="none" />
              <path d={buildPath('gross', 800, 140)} stroke="#3b82f6" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div className="mt-2 text-xs text-gray-600 flex gap-4">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-600 inline-block"></span> Revenue</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block"></span> Expenses</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block"></span> COGS</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block"></span> Gross Profit</span>
          </div>
        </div>

        {/* Period comparisons */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="font-medium mb-2">Previous Period Comparison</div>
            {compare.previous ? (
              <ComparisonGrid current={{ revenue, expense: operatingExpense, cogs, gross: grossProfit, profit }} prev={compare.previous} />
            ) : (
              <div className="text-sm text-gray-500">Not available</div>
            )}
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="font-medium mb-2">Year-over-Year Comparison</div>
            {compare.yoy ? (
              <ComparisonGrid current={{ revenue, expense: operatingExpense, cogs, gross: grossProfit, profit }} prev={compare.yoy} />
            ) : (
              <div className="text-sm text-gray-500">Not available</div>
            )}
          </div>
        </div>
        <form onSubmit={submit} className="bg-white shadow rounded p-4 grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm">From</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">To</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Bucket</label>
            <select className="mt-1 w-full border-gray-300 rounded" value={data.bucket} onChange={e=>setData('bucket', e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
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
            <div className="mt-2 text-sm">
              <Link
                href={route('reports.accounting.journals', { from: data.from, to: data.to, scope: 'revenue' })}
                className="text-indigo-600 hover:underline"
              >View detailed revenue journals →</Link>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500 flex items-center gap-2">Expenses
              <Tooltip text={"All expense accounts (debits) plus computed COGS from purchases, allocated per unit."} />
            </div>
            <div className="text-2xl font-semibold">{formatPKR(Number(expense||0))}</div>
            <div className="mt-2 text-sm">
              <Link
                href={route('reports.accounting.journals', { from: data.from, to: data.to, scope: 'expense' })}
                className="text-indigo-600 hover:underline"
              >View detailed expense journals →</Link>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500 flex items-center gap-2">Net Profit
              <Tooltip text={"Net Profit = Revenue - (Expenses + COGS)."} />
            </div>
            <div className={`text-2xl font-semibold ${Number(profit)>=0? 'text-emerald-600':'text-red-600'}`}>{formatPKR(Number(profit||0))}</div>
          </div>
        </div>

        {/* Enhanced KPIs */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">COGS (Computed)</div>
            <div className="text-xl font-semibold">{formatPKR(Number(cogs||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Operating Expenses (excl. COGS)</div>
            <div className="text-xl font-semibold">{formatPKR(Number(operatingExpense||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Gross Profit</div>
            <div className={`text-xl font-semibold ${Number(grossProfit)>=0? 'text-emerald-600':'text-red-600'}`}>{formatPKR(Number(grossProfit||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Gross Margin %</div>
            <div className="text-xl font-semibold">{grossMarginPct == null ? '-' : `${grossMarginPct}%`}</div>
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
                  <tr key={idx}>
                    <td className="px-4 py-2">{r.code}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={route('reports.accounting.journals', { from: data.from, to: data.to, scope: `account:${r.code}` })}
                        className="text-indigo-600 hover:underline"
                        title="Drill down to account journals"
                      >{r.name}</Link>
                    </td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(r.credit - r.debit))}</td>
                  </tr>
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
                  <tr key={idx}>
                    <td className="px-4 py-2">{r.code}</td>
                    <td className="px-4 py-2">
                      {r.code === 'COGS' ? (
                        <span title="Computed average cost for sold units in period">{r.name}</span>
                      ) : (
                        <Link
                          href={route('reports.accounting.journals', { from: data.from, to: data.to, scope: `account:${r.code}` })}
                          className="text-indigo-600 hover:underline"
                          title="Drill down to account journals"
                        >{r.name}</Link>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(r.debit - r.credit))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top contributors */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded overflow-x-auto">
            <div className="px-4 py-2 font-medium">Top Products (by Gross Profit)</div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Revenue</th>
                <th className="px-4 py-2 text-right">COGS</th>
                <th className="px-4 py-2 text-right">Gross</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {(top.products||[]).map((p, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2 text-right">{Number(p.qty)}</td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(p.revenue||0))}</td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(p.cogs||0))}</td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(p.gross||0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white shadow rounded overflow-x-auto">
            <div className="px-4 py-2 font-medium">Top Customers (by Gross Profit)</div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Revenue</th>
                <th className="px-4 py-2 text-right">COGS</th>
                <th className="px-4 py-2 text-right">Gross</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {(top.customers||[]).map((c, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      {c.customer_id ? (
                        <Link href={route('customers.ledger', c.customer_id)} className="text-indigo-600 hover:underline" title="Open customer ledger">{c.name}</Link>
                      ) : (
                        <span>{c.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">{Number(c.qty)}</td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(c.revenue||0))}</td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(c.cogs||0))}</td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(c.gross||0))}</td>
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

function ComparisonGrid({ current, prev }) {
  const Row = ({ label, cur, pv }) => {
    const delta = Number(cur) - Number(pv);
    const pct = Number(pv) !== 0 ? (delta / Number(pv)) : null;
    return (
      <div className="grid grid-cols-5 text-sm py-1">
        <div className="col-span-2 text-gray-600">{label}</div>
        <div className="text-right">{formatPKR(Number(cur||0))}</div>
        <div className="text-right text-gray-500">{formatPKR(Number(pv||0))}</div>
        <div className={`text-right ${delta>=0? 'text-emerald-600':'text-red-600'}`}>{delta>=0? '+':''}{formatPKR(delta)} {pct==null? '':' ('+fmtPercent(pct)+')'}</div>
      </div>
    );
  };
  const fmtPercent = (v) => `${(v*100).toFixed(1)}%`;
  return (
    <div>
      <div className="grid grid-cols-5 text-xs text-gray-500 border-b pb-1">
        <div className="col-span-2">Metric</div>
        <div className="text-right">Current</div>
        <div className="text-right">Previous</div>
        <div className="text-right">Δ (%, vs prev)</div>
      </div>
      <Row label="Revenue" cur={current.revenue} pv={prev.revenue} />
      <Row label="Operating Expense" cur={current.expense} pv={prev.expense} />
      <Row label="COGS" cur={current.cogs} pv={prev.cogs} />
      <Row label="Gross Profit" cur={current.gross} pv={prev.gross} />
      <Row label="Net Profit" cur={current.profit} pv={prev.profit} />
    </div>
  );
}
