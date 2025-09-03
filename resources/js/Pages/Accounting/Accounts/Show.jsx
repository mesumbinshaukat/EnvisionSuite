import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useI18n } from '@/i18n';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AccountShow({ auth, account, filters, transactions, totals, chart }) {
  const { t, currency, date } = useI18n();
  const { data, setData, get, processing } = useForm({
    from: filters?.from || '',
    to: filters?.to || ''
  });

  const submit = (e) => { e.preventDefault(); get(route('accounts.show', account.id), { preserveState: true, preserveScroll: true }); };

  const lineData = useMemo(() => ({
    labels: (chart?.labels || []),
    datasets: (chart?.datasets || []).map(ds => ({
      ...ds,
      tension: 0.25,
    }))
  }), [chart]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`${t('account')} - ${account.name}`} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t('account')}: {account.code} — {account.name}</h1>
          <Link href={route('accounts.index')} className="text-sm text-gray-600 hover:text-gray-800 underline">{t('back')}</Link>
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
          <div className="flex items-end">
            <button disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t('apply')}</button>
          </div>
        </form>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 shadow rounded">
            <div className="mb-2 font-medium">{t('trends_over_time')}</div>
            <Line data={lineData} />
          </div>
          <div className="bg-white p-4 shadow rounded">
            <div className="mb-2 font-medium">{t('balance')}</div>
            <div className="text-3xl font-semibold">{currency(totals?.balance || 0)}</div>
            <div className="text-sm text-gray-500">{t('account_type')}: <span className="capitalize">{account.type}</span></div>
            <div className="text-sm text-gray-500">{t('status')}: {account.is_closed ? t('closed') : t('open')}</div>
          </div>
        </div>

        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">{t('date_label')}</th>
                <th className="px-4 py-2 text-left">{t('memo')}</th>
                <th className="px-4 py-2 text-right">{t('debit') || 'Debit'}</th>
                <th className="px-4 py-2 text-right">{t('credit') || 'Credit'}</th>
                <th className="px-4 py-2 text-right">{t('balance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tr, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2">{date(tr.date)}</td>
                  <td className="px-4 py-2">{tr.memo}</td>
                  <td className="px-4 py-2 text-right">{currency(tr.debit)}</td>
                  <td className="px-4 py-2 text-right">{currency(tr.credit)}</td>
                  <td className="px-4 py-2 text-right">{currency(tr.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
