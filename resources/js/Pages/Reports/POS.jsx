import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatPKR } from '@/lib/currency';
import { useI18n } from '@/i18n';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function POS({ auth, filters, sales, summary }) {
  const { t } = useI18n();
  const { data, setData, get, processing } = useForm({
    from: filters.from,
    to: filters.to,
    payment_method: filters.payment_method || ''
  });

  const submit = (e) => { e.preventDefault(); get(route('reports.pos'), { preserveState: true }); };

  const byMethod = summary.by_method || [];
  const byCashier = summary.by_cashier || [];

  const userNameById = useMemo(() => {
    const map = {};
    try {
      (sales?.data || []).forEach(s => { if (s.user?.id) map[s.user.id] = s.user.name; });
    } catch {}
    return map;
  }, [sales]);

  const labelForMethod = (m) => {
    const key = (m || '').trim();
    if (!key) return t('unknown');
    return t(key) || key;
  };

  const methodChart = useMemo(() => ({
    labels: byMethod.map(m => labelForMethod(m.payment_method)),
    datasets: [{
      label: t('total') || 'Total',
      backgroundColor: '#2563eb',
      data: byMethod.map(m => Number(m.s || 0))
    }]
  }), [byMethod, t]);

  const cashierChart = useMemo(() => ({
    labels: byCashier.map(c => userNameById[c.user_id] || t('unknown')),
    datasets: [{
      label: t('total') || 'Total',
      backgroundColor: '#059669',
      data: byCashier.map(c => Number(c.s || 0))
    }]
  }), [byCashier, userNameById, t]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('pos_reports') || 'POS Reports'} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t('pos_reports') || 'POS Reports'}</h1>
          <Link href={route('reports.pos.export', data)} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">{t('export_excel') || 'Export Excel'}</Link>
        </div>
        <form onSubmit={submit} className="bg-white shadow rounded p-4 grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm">{t('from') || 'From'}</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">{t('to_label') || 'To'}</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">{t('payment_method') || 'Payment Method'}</label>
            <input className="mt-1 w-full border-gray-300 rounded" placeholder={`${t('cash')}/${t('card')}/${t('mobile')}...`} value={data.payment_method} onChange={e=>setData('payment_method', e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={processing}>{t('apply') || 'Apply'}</button>
          </div>
        </form>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 shadow rounded">
            <div className="mb-2 font-medium">{t('totals_by_payment_method') || 'Totals by Payment Method'}</div>
            <Bar data={methodChart} />
          </div>
          <div className="bg-white p-4 shadow rounded">
            <div className="mb-2 font-medium">{t('totals_by_cashier') || 'Totals by Cashier'}</div>
            <Bar data={cashierChart} />
          </div>
        </div>

        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">{t('id') || 'ID'}</th>
                <th className="px-4 py-2 text-left">{t('date_label') || 'Date'}</th>
                <th className="px-4 py-2 text-left">{t('customer_label') || 'Customer'}</th>
                <th className="px-4 py-2 text-left">{t('cashier') || 'Cashier'}</th>
                <th className="px-4 py-2 text-left">{t('payment') || 'Payment'}</th>
                <th className="px-4 py-2 text-right">{t('total') || 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.data.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-2">{s.id}</td>
                  <td className="px-4 py-2">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{s.customer?.name || t('unknown')}</td>
                  <td className="px-4 py-2">{s.user?.name || t('unknown')}</td>
                  <td className="px-4 py-2">{labelForMethod(s.payment_method)}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(s.total || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500">{t('page_of', { current: sales.current_page, last: sales.last_page })}</div>
      </div>
    </AuthenticatedLayout>
  );
}
