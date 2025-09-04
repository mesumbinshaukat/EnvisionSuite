import React from 'react';
import Tooltip from '@/Components/Tooltip';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';
import { useI18n } from '@/i18n';

export default function ProfitLoss({ auth, filters, revenue, expense, profit, rows, cogs, grossProfit, grossMarginPct, operatingExpense, series = [], compare = {}, bucket = 'daily', top = { products: [], customers: [] } }) {
  const { t } = useI18n();
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
      <Head title={t('profit_loss')} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">{t('profit_loss')}
            <Tooltip text={t('profit_loss_help')}>
              i
            </Tooltip>
          </h1>
          <Link href={route('reports.accounting.profitLoss.export', data)} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">{t('export_excel')}</Link>
        </div>

        {/* Trends */}
        <div className="bg-white p-4 rounded shadow">
          <div className="px-1 pb-3 font-medium">{t('trends_over_time')}</div>
          <div className="overflow-x-auto">
            <svg width="800" height="160" className="min-w-[800px]">
              <path d={buildPath('revenue', 800, 140)} stroke="#059669" strokeWidth="2" fill="none" />
              <path d={buildPath('expense', 800, 140)} stroke="#ef4444" strokeWidth="2" fill="none" />
              <path d={buildPath('cogs', 800, 140)} stroke="#f59e0b" strokeWidth="2" fill="none" />
              <path d={buildPath('gross', 800, 140)} stroke="#3b82f6" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div className="mt-2 text-xs text-gray-600 flex gap-4">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-600 inline-block"></span> {t('legend_revenue')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block"></span> {t('legend_expenses')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block"></span> {t('legend_cogs')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block"></span> {t('legend_gross_profit')}</span>
          </div>
        </div>

        {/* Period comparisons */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="font-medium mb-2">{t('previous_period_comparison')}</div>
            {compare.previous ? (
              <ComparisonGrid current={{ revenue, expense: operatingExpense, cogs, gross: grossProfit, profit }} prev={compare.previous} />
            ) : (
              <div className="text-sm text-gray-500">{t('not_available')}</div>
            )}
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="font-medium mb-2">{t('year_over_year_comparison')}</div>
            {compare.yoy ? (
              <ComparisonGrid current={{ revenue, expense: operatingExpense, cogs, gross: grossProfit, profit }} prev={compare.yoy} />
            ) : (
              <div className="text-sm text-gray-500">{t('not_available')}</div>
            )}
          </div>
        </div>
        <form onSubmit={submit} className="bg-white shadow rounded p-4 grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm">{t('from')}</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">{t('to_label')}</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">{t('bucket')}</label>
            <select className="mt-1 w-full border-gray-300 rounded" value={data.bucket} onChange={e=>setData('bucket', e.target.value)}>
              <option value="daily">{t('daily')}</option>
              <option value="weekly">{t('weekly')}</option>
              <option value="monthly">{t('monthly')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={processing}>{t('apply')}</button>
          </div>
        </form>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500 flex items-center gap-2">{t('revenue')}
              <Tooltip text={t('revenue_accounts_help')} />
            </div>
            <div className="text-2xl font-semibold">{formatPKR(Number(revenue||0))}</div>
            <div className="mt-2 text-sm">
              <Link
                href={route('reports.accounting.journals', { from: data.from, to: data.to, scope: 'revenue' })}
                className="text-indigo-600 hover:underline"
              >{t('view_detailed_revenue_journals')}</Link>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500 flex items-center gap-2">{t('expenses')}
              <Tooltip text={t('expense_accounts_help')} />
            </div>
            <div className="text-2xl font-semibold">{formatPKR(Number(expense||0))}</div>
            <div className="mt-2 text-sm">
              <Link
                href={route('reports.accounting.journals', { from: data.from, to: data.to, scope: 'expense' })}
                className="text-indigo-600 hover:underline"
              >{t('view_detailed_expense_journals')}</Link>
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500 flex items-center gap-2">{t('net_profit')}
              <Tooltip text={'Net Profit = Revenue - (Expenses + COGS).'} />
            </div>
            <div className={`text-2xl font-semibold ${Number(profit)>=0? 'text-emerald-600':'text-red-600'}`}>{formatPKR(Number(profit||0))}</div>
          </div>
        </div>

        {/* Enhanced KPIs */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">{t('cogs_computed')}</div>
            <div className="text-xl font-semibold">{formatPKR(Number(cogs||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">{t('operating_expenses_excl_cogs')}</div>
            <div className="text-xl font-semibold">{formatPKR(Number(operatingExpense||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">{t('gross_profit')}</div>
            <div className={`text-xl font-semibold ${Number(grossProfit)>=0? 'text-emerald-600':'text-red-600'}`}>{formatPKR(Number(grossProfit||0))}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">{t('gross_margin_pct')}</div>
            <div className="text-xl font-semibold">{grossMarginPct == null ? '-' : `${grossMarginPct}%`}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded overflow-x-auto">
            <div className="px-4 py-2 font-medium flex items-center gap-2">{t('revenue_accounts')}
              <Tooltip text={t('revenue_accounts_help')} />
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left">{t('code')}</th>
                <th className="px-4 py-2 text-left">{t('account')}</th>
                <th className="px-4 py-2 text-right">{t('amount')} <Tooltip text={t('revenue_accounts_help')} /></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {rows.revenue.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{r.code}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={route('reports.accounting.journals', { from: data.from, to: data.to, scope: `account:${r.code}` })}
                        className="text-indigo-600 hover:underline"
                        title={t('drill_down_account_journals')}
                      >{r.name}</Link>
                    </td>
                    <td className="px-4 py-2 text-right">{formatPKR(Number(r.credit - r.debit))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white shadow rounded overflow-x-auto">
            <div className="px-4 py-2 font-medium flex items-center gap-2">{t('expense_accounts')}
              <Tooltip text={t('expense_accounts_help')} />
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left">{t('code')}</th>
                <th className="px-4 py-2 text-left">{t('account')}</th>
                <th className="px-4 py-2 text-right">{t('amount')} <Tooltip text={t('expense_accounts_help')} /></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {rows.expense.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{r.code}</td>
                    <td className="px-4 py-2">
                      {r.code === 'COGS' ? (
                        <span title={t('computed_avg_cost_note')}>{r.name}</span>
                      ) : (
                        <Link
                          href={route('reports.accounting.journals', { from: data.from, to: data.to, scope: `account:${r.code}` })}
                          className="text-indigo-600 hover:underline"
                          title={t('drill_down_account_journals')}
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
            <div className="px-4 py-2 font-medium">{t('top_products_by_gross_profit')}</div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left">{t('product')}</th>
                <th className="px-4 py-2 text-right">{t('qty')}</th>
                <th className="px-4 py-2 text-right">{t('revenue')}</th>
                <th className="px-4 py-2 text-right">{t('cogs')}</th>
                <th className="px-4 py-2 text-right">{t('gross_profit')}</th>
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
            <div className="px-4 py-2 font-medium">{t('top_customers_by_gross_profit')}</div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left">{t('customer')}</th>
                <th className="px-4 py-2 text-right">{t('qty')}</th>
                <th className="px-4 py-2 text-right">{t('revenue')}</th>
                <th className="px-4 py-2 text-right">{t('cogs')}</th>
                <th className="px-4 py-2 text-right">{t('gross_profit')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {(top.customers||[]).map((c, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      {c.customer_id ? (
                        <Link href={route('customers.ledger', c.customer_id)} className="text-indigo-600 hover:underline" title={t('drill_customer_ledger')}>{c.name}</Link>
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
  const { t } = useI18n();
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
        <div className="col-span-2">{t('metric')}</div>
        <div className="text-right">{t('current')}</div>
        <div className="text-right">{t('previous')}</div>
        <div className="text-right">{t('delta_vs_prev')}</div>
      </div>
      <Row label={t('revenue')} cur={current.revenue} pv={prev.revenue} />
      <Row label={t('expenses')} cur={current.expense} pv={prev.expense} />
      <Row label={t('cogs')} cur={current.cogs} pv={prev.cogs} />
      <Row label={t('gross_profit')} cur={current.gross} pv={prev.gross} />
      <Row label={t('net_profit')} cur={current.profit} pv={prev.profit} />
    </div>
  );
}
