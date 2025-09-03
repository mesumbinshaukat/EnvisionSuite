import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import FmtCurrency from '@/Components/FmtCurrency';
import FmtNumber from '@/Components/FmtNumber';
import FmtDate from '@/Components/FmtDate';
import { useI18n } from '@/i18n';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Legend);

export default function Sales({ auth, filters, sales, total, pricingStats, paymentAggregates = [], discountsByCustomer = [], discountsByProduct = [] }) {
  const { t, date, currency, isRTL } = useI18n();
  const { get, data, setData } = useForm({ from: filters.from, to: filters.to });
  const submit = (e) => { e.preventDefault(); get(route('reports.sales'), { preserveState: true }); };

  const chartData = useMemo(() => {
    const points = (sales.data || []).reverse();
    const labels = points.map(s => date(s.created_at, { year: 'numeric', month: 'short', day: 'numeric' }));
    const totals = points.map(s => parseFloat(s.total));
    return { labels, datasets: [{ label: t('sales_report'), data: totals, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.2)' }] };
  }, [sales, date, t]);

  const chartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { usePointStyle: true }, align: isRTL ? 'start' : 'center' },
      tooltip: {
        callbacks: {
          title: (items) => (items?.[0]?.label) || '',
          label: (ctx) => `${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${currency(Number(ctx.parsed.y ?? ctx.parsed))}`,
        }
      }
    },
    scales: {
      y: { ticks: { callback: (val) => currency(val) } },
      x: { ticks: { autoSkip: true, maxTicksLimit: 8 } }
    }
  }), [currency, isRTL]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('sales_report')} />
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-semibold flex items-center gap-2" data-help-key="sales_report_title">{t('sales_report')}</h1>
        <form onSubmit={submit} className="flex gap-2 items-end">
          <div>
            <label className="block text-sm text-gray-600 flex items-center gap-2" data-help-key="sales_filter_from">{t('date_from')}</label>
            <input type="date" className="border rounded px-3 py-2" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 flex items-center gap-2" data-help-key="sales_filter_to">{t('date_to')}</label>
            <input type="date" className="border rounded px-3 py-2" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">{t('apply_label')}</button>
          <Link className="px-4 py-2 bg-green-600 text-white rounded" href={route('reports.sales.export', { from: data.from, to: data.to })}>{t('export_excel_label')}</Link>
        </form>

        <div className="bg-white p-4 rounded shadow">
          <div className="h-64"><Line data={chartData} options={chartOptions} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500 flex items-center gap-2" data-help-key="sales_avg_sold_price">{t('average_sold_price')}</div>
            <div className="text-2xl font-semibold"><FmtCurrency value={pricingStats?.avg_sold_price ?? 0} /></div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500 flex items-center gap-2" data-help-key="sales_units_original">{t('units_original_price')}</div>
            <div className="text-2xl font-semibold"><FmtNumber value={pricingStats?.units_original_price ?? 0} /></div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500 flex items-center gap-2" data-help-key="sales_units_discounted">{t('units_discounted_price')}</div>
            <div className="text-2xl font-semibold"><FmtNumber value={pricingStats?.units_discounted_price ?? 0} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentAggregates.map((p) => (
            <div key={p.status} className="bg-white p-4 rounded shadow">
              <div className="text-xs uppercase text-gray-500">{p.status}</div>
              <div className="mt-1 text-sm text-gray-600">{t('count_label')}: <FmtNumber value={p.cnt} /></div>
              <div className="mt-1 text-sm text-gray-600">{t('paid')}: <FmtCurrency value={p.paid_sum} /></div>
              <div className="mt-1 text-sm text-gray-600">{t('total_label')} <FmtCurrency value={p.total_sum} /></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase" data-help-key="sales_th_id">{t('id')}</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase" data-help-key="sales_th_date">{t('date')}</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase" data-help-key="sales_th_customer">{t('customer_label')}</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase" data-help-key="sales_th_type">{t('type_label')}</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase" data-help-key="sales_th_items">{t('items')}</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase" data-help-key="sales_th_units">{t('units')}</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase" data-help-key="sales_th_paid">{t('paid')}</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase" data-help-key="sales_th_payment">{t('payment')}</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase" data-help-key="sales_th_total">{t('total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(sales.data || []).map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-2"><FmtNumber value={s.id} /></td>
                  <td className="px-4 py-2"><FmtDate value={s.created_at} options={{ year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} /></td>
                  <td className="px-4 py-2">{s.customer_name || t('walk_in')}</td>
                  <td className="px-4 py-2">{s.customer_type}</td>
                  <td className="px-4 py-2 text-right"><FmtNumber value={s.items_count} /></td>
                  <td className="px-4 py-2 text-right"><FmtNumber value={s.units_count} /></td>
                  <td className="px-4 py-2 text-right"><FmtCurrency value={s.amount_paid || 0} /></td>
                  <td className="px-4 py-2">{s.payment_status || '-'}</td>
                  <td className="px-4 py-2 text-right"><FmtCurrency value={s.total} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 text-right font-semibold">{t('total_label')} <FmtCurrency value={total} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="px-4 py-2 font-semibold" data-help-key="sales_dc_total_discount">{t('top_discounts_by_customer')}</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase" data-help-key="sales_dc_customer">{t('customer_label')}</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase" data-help-key="sales_dc_line_discount">{t('line_discount')}</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase" data-help-key="sales_dc_header_discount">{t('header_discount')}</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase" data-help-key="sales_dc_total_discount">{t('total_discount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(discountsByCustomer || []).map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{row.customer_name || t('walk_in')}</td>
                    <td className="px-4 py-2 text-right"><FmtCurrency value={row.line_discount} /></td>
                    <td className="px-4 py-2 text-right"><FmtCurrency value={row.header_discount} /></td>
                    <td className="px-4 py-2 text-right font-semibold"><FmtCurrency value={row.total_discount} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="px-4 py-2 font-semibold" data-help-key="sales_dp_line_discount">{t('top_discounts_by_product')}</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase" data-help-key="sales_dp_product">{t('product_label')}</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase" data-help-key="sales_dp_line_discount">{t('line_discount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(discountsByProduct || []).map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{row.product_name}</td>
                    <td className="px-4 py-2 text-right"><FmtCurrency value={row.line_discount} /></td>
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
