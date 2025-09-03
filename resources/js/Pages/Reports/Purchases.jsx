import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import FmtCurrency from '@/Components/FmtCurrency';
import FmtNumber from '@/Components/FmtNumber';
import FmtDate from '@/Components/FmtDate';
import { useI18n } from '@/i18n';

export default function PurchasesReport({ filters, aggregates, chart, vendorSummary = [], productSummary = [], purchases, options = {} }) {
  const { t } = useI18n();
  const days = chart?.days ?? (filters?.days ?? 30);
  const labels = chart?.labels ?? [];
  const spend = chart?.spend ?? [];
  const qty = chart?.qty ?? [];

  // Compute scales for SVG
  const W = 920; // inner width
  const H = 280; // inner height
  const P = { t: 16, r: 40, b: 40, l: 48 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const n = labels.length || 1;
  const maxSpend = Math.max(1, ...spend);
  const maxQty = Math.max(1, ...qty);
  const x = (i) => P.l + (i * innerW) / Math.max(1, n - 1);
  const ySpend = (v) => P.t + innerH - (v / maxSpend) * innerH;
  const yQty = (v) => P.t + innerH - (v / maxQty) * innerH;

  const spendPath = spend.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${ySpend(v)}`).join(' ');
  const barW = Math.min(24, innerW / Math.max(1, n) * 0.6);

  const PeriodLink = ({ d, children }) => (
    <Link href={route('reports.purchases', { days: d })} preserveState preserveScroll className={`px-3 py-1 rounded border text-sm ${Number(days) === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
      {children}
    </Link>
  );

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800" data-help-key="purchases_over_time">{t('purchases_report')}</h2>}>
      <Head title={t('purchases_report')} />
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600" data-help-key="purchases_total_spend">{t('total_spend')}</div><div className="text-2xl font-semibold"><FmtCurrency value={aggregates.totalSpend ?? 0} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600" data-help-key="purchases_total_qty">{t('total_quantity')}</div><div className="text-2xl font-semibold"><FmtNumber value={aggregates.totalQty ?? 0} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600" data-help-key="purchases_avg_unit_cost">{t('avg_unit_cost')}</div><div className="text-2xl font-semibold"><FmtCurrency value={aggregates.avgUnitCost ?? 0} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600" data-help-key="purchases_outstanding">{t('outstanding_payables')}</div><div className="text-2xl font-semibold"><FmtCurrency value={aggregates.outstanding ?? 0} /></div></div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600" data-help-key="purchases_avg_daily_spend">{t('avg_daily_spend')}</div><div className="text-2xl font-semibold"><FmtCurrency value={aggregates.avgDailySpend ?? 0} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600" data-help-key="purchases_avg_daily_qty">{t('avg_daily_qty')}</div><div className="text-2xl font-semibold"><FmtNumber value={aggregates.avgDailyQty ?? 0} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600" data-help-key="purchases_weekly_avg_spend">{t('weekly_avg_spend')}</div><div className="text-2xl font-semibold"><FmtCurrency value={aggregates.weeklyAvgSpend ?? 0} /></div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600" data-help-key="purchases_monthly_avg_spend">{t('monthly_avg_spend')}</div><div className="text-2xl font-semibold"><FmtCurrency value={aggregates.monthlyAvgSpend ?? 0} /></div></div>
        </div>

        {/* Filters */}
        <div className="rounded bg-white p-4 shadow">
          <form method="get" action={route('reports.purchases')} className="grid gap-3 md:grid-cols-4">
            <input type="hidden" name="days" value={days} />
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('vendor_label')}</label>
              <select name="vendor_id" defaultValue={filters?.vendor_id || ''} className="w-full rounded border-gray-300 text-sm">
                <option value="">{t('all_vendors')}</option>
                {options?.vendors?.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('product_label')}</label>
              <select name="product_id" defaultValue={filters?.product_id || ''} className="w-full rounded border-gray-300 text-sm">
                <option value="">{t('all_products')}</option>
                {options?.products?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('status_label')}</label>
              <select name="status" defaultValue={filters?.status || ''} className="w-full rounded border-gray-300 text-sm">
                <option value="">{t('any_status')}</option>
                {options?.statuses?.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="inline-flex items-center rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">{t('apply_label')}</button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800" data-help-key="purchases_over_time">{t('purchases_over_time')}</h3>
          <div className="flex gap-2">
            <PeriodLink d={7}>7d</PeriodLink>
            <PeriodLink d={14}>14d</PeriodLink>
            <PeriodLink d={30}>30d</PeriodLink>
            <Link href={route('reports.purchases.export', { days, vendor_id: filters?.vendor_id || undefined, product_id: filters?.product_id || undefined, status: filters?.status || undefined })} className="ml-2 inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
              {t('export')}
            </Link>
          </div>
        </div>

        <div className="rounded bg-white p-4 shadow overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-72">
            {/* Axes */}
            <line x1={P.l} y1={P.t + innerH} x2={P.l + innerW} y2={P.t + innerH} stroke="#E5E7EB" />
            <line x1={P.l} y1={P.t} x2={P.l} y2={P.t + innerH} stroke="#E5E7EB" />

            {/* Spend line and area */}
            <path d={`${spendPath} L ${P.l + innerW} ${P.t + innerH} L ${P.l} ${P.t + innerH} Z`} fill="rgba(99,102,241,0.12)" />
            <path d={spendPath} fill="none" stroke="#6366F1" strokeWidth="2" />

            {/* Qty bars */}
            {qty.map((v, i) => (
              <rect key={i} x={x(i) - barW / 2} y={yQty(v)} width={barW} height={P.t + innerH - yQty(v)} fill="#10B981" opacity="0.7" />
            ))}

            {/* Y-axis labels (left for spend, right for qty) */}
            <text x={P.l - 8} y={P.t + 10} textAnchor="end" fontSize="10" fill="#6B7280">{t('spend')}</text>
            <text x={P.l + innerW + 8} y={P.t + 10} textAnchor="start" fontSize="10" fill="#6B7280">{t('quantity')}</text>

            {/* X-axis labels (sparse to avoid clutter) */}
            {labels.map((d, i) => (
              (n <= 12 || i % Math.ceil(n / 12) === 0) ? (
                <text key={i} x={x(i)} y={P.t + innerH + 16} textAnchor="middle" fontSize="10" fill="#6B7280">{d.slice(5)}</text>
              ) : null
            ))}
          </svg>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-indigo-500"></span> {t('spend')}</div>
            <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-emerald-500"></span> {t('quantity')}</div>
          </div>
        </div>

        {/* Vendor summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-3" data-help-key="purchases_top_vendors">{t('top_vendors')}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4" data-help-key="purchases_th_vendor">{t('purchases_th_vendor')}</th>
                    <th className="py-2 pr-4" data-help-key="purchases_th_purchases">{t('purchases_th_purchases')}</th>
                    <th className="py-2 pr-4" data-help-key="purchases_th_units">{t('purchases_th_units')}</th>
                    <th className="py-2 pr-4" data-help-key="purchases_th_avg_unit">{t('purchases_th_avg_unit')}</th>
                    <th className="py-2 pr-4" data-help-key="purchases_th_spend">{t('purchases_th_spend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorSummary?.map((v, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{v.vendor_name}</td>
                      <td className="py-2 pr-4"><FmtNumber value={v.purchases_count} /></td>
                      <td className="py-2 pr-4"><FmtNumber value={v.total_qty} /></td>
                      <td className="py-2 pr-4"><FmtCurrency value={v.avg_unit_cost ?? 0} /></td>
                      <td className="py-2 pr-4"><FmtCurrency value={v.total_spend ?? 0} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product summary */}
          <div className="rounded bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-3" data-help-key="purchases_top_products">{t('top_purchased_products')}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4" data-help-key="purchases_th_product">{t('product_label')}</th>
                    <th className="py-2 pr-4" data-help-key="purchases_th_units">{t('purchases_th_units')}</th>
                    <th className="py-2 pr-4" data-help-key="purchases_th_avg_unit">{t('purchases_th_avg_unit')}</th>
                    <th className="py-2 pr-4" data-help-key="purchases_th_total_cost">{t('total_cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {productSummary?.map((p, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{p.product_name}</td>
                      <td className="py-2 pr-4"><FmtNumber value={p.total_qty} /></td>
                      <td className="py-2 pr-4"><FmtCurrency value={p.avg_unit_cost ?? 0} /></td>
                      <td className="py-2 pr-4"><FmtCurrency value={p.total_cost ?? 0} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detailed purchases */}
        <div className="rounded bg-white p-4 shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('detailed_purchases')}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4" data-help-key="purchases_th_datetime">{t('purchases_th_datetime')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_vendor">{t('purchases_th_vendor')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_items">{t('items')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_units">{t('purchases_th_units')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_subtotal">{t('purchases_th_subtotal')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_tax">{t('purchases_th_tax')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_other">{t('purchases_th_other')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_total">{t('purchases_th_total')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_paid">{t('purchases_th_paid')}</th>
                  <th className="py-2 pr-4" data-help-key="purchases_th_status">{t('purchases_th_status')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases?.data?.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4 whitespace-nowrap"><FmtDate value={row.date} options={{ year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} /></td>
                    <td className="py-2 pr-4">{row.vendor}</td>
                    <td className="py-2 pr-4"><FmtNumber value={row.items} /></td>
                    <td className="py-2 pr-4"><FmtNumber value={row.units} /></td>
                    <td className="py-2 pr-4"><FmtCurrency value={row.subtotal} /></td>
                    <td className="py-2 pr-4"><FmtCurrency value={row.tax_total} /></td>
                    <td className="py-2 pr-4"><FmtCurrency value={row.other_charges} /></td>
                    <td className="py-2 pr-4"><FmtCurrency value={row.grand_total} /></td>
                    <td className="py-2 pr-4"><FmtCurrency value={row.amount_paid} /></td>
                    <td className="py-2 pr-4">{row.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {purchases?.links && (
            <div className="mt-3 flex flex-wrap gap-2">
              {purchases.links.map((l, idx) => (
                <Link key={idx} href={l.url || '#'} preserveState preserveScroll className={`px-3 py-1 rounded border text-sm ${l.active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} ${!l.url ? 'pointer-events-none opacity-50' : ''}`} dangerouslySetInnerHTML={{ __html: l.label }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
