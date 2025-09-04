import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Currency from '@/Components/Currency';
import { useI18n } from '@/i18n';
import SimplePie from '@/Components/Charts/SimplePie';
import SimpleBar from '@/Components/Charts/SimpleBar';

export default function Dashboard({ kpis, recentJournals, ledgerBalances }) {
  const { t } = useI18n();
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('dashboard')}</h2>}>
      <Head title={t('dashboard')} />
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('sales_today')}</div><div className="text-2xl font-semibold">{kpis.salesToday}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('sales_this_month')}</div><div className="text-2xl font-semibold">{kpis.salesMonth}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('orders')}</div><div className="text-2xl font-semibold">{kpis.ordersCount}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('products_label')}</div><div className="text-2xl font-semibold">{kpis.productsCount}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('ledger_accounts')}</div><div className="text-2xl font-semibold">{kpis.ledgerAccounts}</div></div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('avg_sold_price')}</div><div className="text-2xl font-semibold"><Currency value={kpis.avgSoldPrice} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('units_original')}</div><div className="text-2xl font-semibold">{kpis.unitsOriginal ?? 0}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('units_discounted')}</div><div className="text-2xl font-semibold">{kpis.unitsDiscounted ?? 0}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('lent_out_units')}</div><div className="text-2xl font-semibold">{kpis.lentOutTotal ?? 0}</div></div>
        </div>

        {/* Charts: Assets breakdown, Units mix, and Assets overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-3 text-lg font-semibold">{t('assets_breakdown')}</h3>
            <SimplePie
              data={[
                { label: t('cash_in_hand'), value: kpis.cashInHand ?? 0, color: '#22c55e' },
                { label: t('bank_balance_label'), value: kpis.bankBalance ?? 0, color: '#3b82f6' },
                { label: t('receivables_label'), value: kpis.receivables ?? 0, color: '#a855f7' },
              ]}
              size={200}
            />
          </div>
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-3 text-lg font-semibold">{t('net_overview')}</h3>
            <SimplePie
              data={[
                { label: t('assets'), value: Math.max(0, (kpis.cashInHand ?? 0) + (kpis.bankBalance ?? 0) + (kpis.receivables ?? 0)), color: '#10b981' },
                { label: t('liabilities'), value: Math.abs(kpis.payables ?? 0), color: '#ef4444' },
              ]}
              size={200}
            />
          </div>
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-3 text-lg font-semibold">{t('assets')}</h3>
            <SimpleBar
              data={[
                { label: t('cash_in_hand'), value: kpis.cashInHand ?? 0, color: '#16a34a' },
                { label: t('bank_balance_label'), value: kpis.bankBalance ?? 0, color: '#2563eb' },
                { label: t('receivables_label'), value: kpis.receivables ?? 0, color: '#7c3aed' },
                { label: t('payables_label'), value: Math.abs(kpis.payables ?? 0), color: '#dc2626' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('cash_in_hand')}</div><div className="text-2xl font-semibold"><Currency value={kpis.cashInHand} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('bank_balance_label')}</div><div className="text-2xl font-semibold"><Currency value={kpis.bankBalance} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('receivables_label')}</div><div className="text-2xl font-semibold"><Currency value={kpis.receivables} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('payables_label')}</div><div className="text-2xl font-semibold"><Currency value={kpis.payables} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">{t('net_profit_month')}</div><div className={`text-2xl font-semibold ${Number(kpis.netProfitMonth)>=0? 'text-emerald-600':'text-red-600'}`}><Currency value={kpis.netProfitMonth} /></div></div>
        </div>

        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 text-lg font-semibold">{t('quick_actions')}</h3>
          <div className="flex flex-wrap gap-3">
            <Link href={route().has('inventory.loans.index') ? route('inventory.loans.index') : '#'} className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">{t('inventory_loans_label')}</Link>
            <Link href={route().has('inventory.loans.create') ? route('inventory.loans.create') : '#'} className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">{t('new_loan')}</Link>
            <Link href={route().has('reports.sales') ? route('reports.sales') : '#'} className="inline-flex items-center rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800">{t('sales_report_label')}</Link>
            <Link href={route().has('reports.inventory') ? route('reports.inventory') : '#'} className="inline-flex items-center rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800">{t('inventory_report_label')}</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-3 text-lg font-semibold">{t('average_sales')}</h3>
            <SimplePie
              data={[
                { label: t('units_original_price'), value: kpis.unitsOriginal ?? 0, color: '#0ea5e9' },
                { label: t('units_discounted_price'), value: kpis.unitsDiscounted ?? 0, color: '#f59e0b' },
                { label: t('lent_out_units'), value: kpis.lentOutTotal ?? 0, color: '#10b981' },
              ]}
              size={200}
            />
          </div>
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-3 text-lg font-semibold">{t('price_increase_trend')}</h3>
            <SimpleBar
              data={[
                { label: t('sales_this_month'), value: kpis.salesMonth ?? 0, color: '#2563eb' },
                { label: t('sales_today'), value: kpis.salesToday ?? 0, color: '#22c55e' },
                { label: t('orders'), value: kpis.ordersCount ?? 0, color: '#f97316' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">{t('recent_journal_entries')}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left">{t('date_label')}</th>
                    <th className="px-2 py-2 text-left">{t('memo')}</th>
                    <th className="px-2 py-2 text-right">{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJournals?.map(j => (
                    <tr key={j.id} className="border-t">
                      <td className="px-2 py-2">{j.date}</td>
                      <td className="px-2 py-2">{j.memo || '-'}</td>
                      <td className="px-2 py-2 text-right">
                        {route().has('reports.journals') && (
                          <Link href={route('reports.journals', { from: j.date, to: j.date })} className="text-indigo-600 hover:underline">{t('view')}</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-semibold">{t('ledger_balances')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {ledgerBalances.map((b, i)=> (
                <div key={i} className="rounded border p-3"><div className="text-sm text-gray-600">{b.currency}</div><div className="text-xl font-semibold"><Currency value={b.total} /></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
