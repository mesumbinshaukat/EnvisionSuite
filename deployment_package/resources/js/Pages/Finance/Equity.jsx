import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useI18n } from '@/i18n';
import FmtCurrency from '@/Components/FmtCurrency';
import FmtNumber from '@/Components/FmtNumber';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ChartTooltip, Legend);

export default function Equity({ auth, balances, salesAverages, priceInsights, probabilities }) {
  const { t, n, currency, isRTL } = useI18n();

  const Paginate = ({ paginator, pageParam, perPageParam }) => {
    if (!paginator) return null;
    const links = paginator.links || [];
    const current = paginator.current_page || paginator.meta?.current_page;
    const last = paginator.last_page || paginator.meta?.last_page;
    const per = paginator.per_page || paginator.meta?.per_page;
    // Prefer server-provided links
    if (links && links.length > 0) {
      return (
        <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600">
          <div>
            {t('page')} {current} {t('of')} {last} ({paginator.total || paginator.meta?.total || 0})
          </div>
          <div className="flex gap-1">
            {links.map((l, i) => (
              <Link
                key={i}
                href={l.url || '#'}
                className={`px-2 py-1 rounded ${l.active ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} ${!l.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                preserveScroll
              >
                {/* Laravel labels can be « Previous, 1, 2, Next » */}
                <span dangerouslySetInnerHTML={{ __html: l.label }} />
              </Link>
            ))}
          </div>
        </div>
      );
    }
    // Fallback simple prev/next
    const buildHref = (page) => {
      const url = new URL(window.location.href);
      url.searchParams.set(pageParam, String(page));
      if (per) url.searchParams.set(perPageParam, String(per));
      return url.pathname + url.search;
    };
    return (
      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600">
        <div>
          {t('page')} {current} {t('of')} {last}
        </div>
        <div className="flex gap-1">
          <Link href={current > 1 ? buildHref(current - 1) : '#'} className={`px-2 py-1 rounded ${current > 1 ? 'bg-gray-100 hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`} preserveScroll>
            {t('previous')}
          </Link>
          <Link href={current < last ? buildHref(current + 1) : '#'} className={`px-2 py-1 rounded ${current < last ? 'bg-gray-100 hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`} preserveScroll>
            {t('next')}
          </Link>
        </div>
      </div>
    );
  };

  const pieData = useMemo(()=>({
    labels: [t('cash_balance'), t('bank_balance'), t('inventory_value'), t('receivables')],
    datasets: [{
      data: [balances?.cash||0, balances?.bank||0, balances?.inventory||0, balances?.receivables||0],
      backgroundColor: ['#22c55e','#0ea5e9','#6366f1','#f59e0b'],
    }]
  }), [balances, t]);

  const netSeries = useMemo(()=>({
    labels: [t('assets'), t('liabilities'), t('net_worth')],
    datasets: [{
      label: t('equity_dashboard'),
      data: [
        (Number(balances?.assetsTotal) || 0),
        (Number(balances?.liabilitiesTotal) || 0),
        (Number(balances?.netWorth) || 0),
      ],
      backgroundColor: ['#10b981','#ef4444','#2563eb']
    }]
  }), [balances, t]);

  const avgSeries = useMemo(()=>({
    labels: [t('avg_daily'), t('avg_weekly'), t('avg_monthly')],
    datasets: [{
      label: t('average_sales'),
      data: [salesAverages?.daily||0, salesAverages?.weekly||0, salesAverages?.monthly||0],
      borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.2)'
    }]
  }), [salesAverages, t]);

  const commonOpts = useMemo(()=>({
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { usePointStyle: true }, align: isRTL ? 'start' : 'center' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const parsed = ctx.parsed;
            const val = (parsed && typeof parsed === 'object') ? (parsed.y ?? ctx.raw) : (parsed ?? ctx.raw);
            const v = Number(val) || 0;
            return `${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${currency(v)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (val) => currency(val)
        }
      },
      x: {
        ticks: { autoSkip: true, maxTicksLimit: 8 }
      }
    }
  }), [currency, isRTL]);

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={t('equity_dashboard')} />
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-semibold" data-help-key="equity_title">{t('equity_dashboard')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500" data-help-key="store_worth">{t('store_worth')}</div>
            <div className="text-2xl font-semibold"><FmtCurrency value={balances?.netWorth||0} /></div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500" data-help-key="net_cash_after_liabilities">{t('net_cash_after_liabilities')}</div>
            <div className="text-2xl font-semibold"><FmtCurrency value={(balances?.cash||0)+(balances?.bank||0)+(balances?.receivables||0)-(balances?.payables||0)} /></div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500" data-help-key="avg_daily">{t('avg_daily')}</div>
            <div className="text-2xl font-semibold"><FmtCurrency value={salesAverages?.daily||0} /></div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500" data-help-key="avg_monthly">{t('avg_monthly')}</div>
            <div className="text-2xl font-semibold"><FmtCurrency value={salesAverages?.monthly||0} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm font-semibold mb-2" data-help-key="assets_breakdown">{t('assets_breakdown')}</div>
            <div className="h-64"><Pie data={pieData} options={commonOpts} /></div>
          </div>
          <div className="bg-white p-4 rounded shadow md:col-span-2">
            <div className="text-sm font-semibold mb-2" data-help-key="net_overview">{t('net_overview')}</div>
            <div className="h-64"><Bar data={netSeries} options={commonOpts} /></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm font-semibold mb-2" data-help-key="average_sales">{t('average_sales')}</div>
          <div className="h-64"><Line data={avgSeries} options={{ ...commonOpts, plugins: { ...commonOpts.plugins, tooltip: { callbacks: { label: (ctx)=> `${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${currency(Number(ctx.parsed.y||ctx.parsed))}` } } } }} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="px-4 py-2 font-semibold" data-help-key="price_increase_trend">{t('price_increase_trend')}</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">% Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(priceInsights?.increases?.data || priceInsights?.increases || []).map((r,i)=> (
                  <tr key={i}>
                    <td className="px-4 py-2">{r.product_name}</td>
                    <td className="px-4 py-2 text-right"><FmtNumber value={r.change_pct} /></td>
                  </tr>
                ))}
                {((priceInsights?.increases?.data?.length??0)===0 && (priceInsights?.increases?.length??0)===0) && (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={2}>—</td></tr>
                )}
              </tbody>
            </table>
            <Paginate paginator={priceInsights?.increases} pageParam="increases_page" perPageParam="increases_per_page" />
          </div>
          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="px-4 py-2 font-semibold" data-help-key="vendor_price_comparison">{t('vendor_price_comparison')}</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Vendor</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Avg Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(priceInsights?.vendorComparisons?.data || priceInsights?.vendorComparisons || []).map((r,i)=> (
                  <tr key={i}>
                    <td className="px-4 py-2">{r.product_name}</td>
                    <td className="px-4 py-2">{r.vendor_name}</td>
                    <td className="px-4 py-2 text-right"><FmtCurrency value={r.avg_cost} /></td>
                  </tr>
                ))}
                {((priceInsights?.vendorComparisons?.data?.length??0)===0 && (priceInsights?.vendorComparisons?.length??0)===0) && (
                  <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={3}>—</td></tr>
                )}
              </tbody>
            </table>
            <Paginate paginator={priceInsights?.vendorComparisons} pageParam="vendor_page" perPageParam="vendor_per_page" />
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-x-auto">
          <div className="px-4 py-2 font-semibold" data-help-key="probability_high_sales">{t('probability_high_sales')}</div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Probability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(probabilities?.topProducts?.data || probabilities?.topProducts || []).map((r,i)=> (
                <tr key={i}>
                  <td className="px-4 py-2">{r.product_name}</td>
                  <td className="px-4 py-2 text-right"><FmtNumber value={r.probability} /></td>
                </tr>
              ))}
              {((probabilities?.topProducts?.data?.length??0)===0 && (probabilities?.topProducts?.length??0)===0) && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={2}>—</td></tr>
              )}
            </tbody>
          </table>
          <Paginate paginator={probabilities?.topProducts} pageParam="products_page" perPageParam="products_per_page" />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
