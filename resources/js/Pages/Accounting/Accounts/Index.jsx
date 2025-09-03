import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useI18n } from '@/i18n';

export default function AccountsIndex({ auth, filters, accounts, balances }) {
  const { t, currency } = useI18n();
  const { data, setData, get } = useForm({
    q: filters?.q || '',
    status: filters?.status || 'all',
    type: filters?.type || '',
  });

  const submit = (e) => { e.preventDefault(); get(route('accounts.index'), { preserveState: true, preserveScroll: true }); };

  const types = useMemo(() => ([
    { value: '', label: t('all') },
    { value: 'asset', label: t('assets') || 'Assets' },
    { value: 'liability', label: t('liabilities') || 'Liabilities' },
    { value: 'equity', label: t('equity_dashboard') || 'Equity' },
    { value: 'revenue', label: t('revenue') || 'Revenue' },
    { value: 'expense', label: t('expenses') || 'Expenses' },
  ]), [t]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`${t('accounts')}`} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t('accounts')}</h1>
        </div>

        <form onSubmit={submit} className="bg-white shadow rounded p-4 grid md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm">{t('search')}</label>
            <input value={data.q} onChange={(e)=> setData('q', e.target.value)} placeholder={t('account_name')} className="mt-1 w-full border-gray-300 rounded" />
          </div>
          <div>
            <label className="block text-sm">{t('status')}</label>
            <select value={data.status} onChange={(e)=> setData('status', e.target.value)} className="mt-1 w-full border-gray-300 rounded">
              <option value="all">{t('all')}</option>
              <option value="open">{t('open')}</option>
              <option value="closed">{t('closed')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">{t('type_label')}</label>
            <select value={data.type} onChange={(e)=> setData('type', e.target.value)} className="mt-1 w-full border-gray-300 rounded">
              {types.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t('filter')}</button>
          </div>
        </form>

        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">{t('account_code')}</th>
                <th className="px-4 py-2 text-left">{t('account_name')}</th>
                <th className="px-4 py-2 text-left">{t('account_type')}</th>
                <th className="px-4 py-2 text-left">{t('status')}</th>
                <th className="px-4 py-2 text-right">{t('balance') || 'Balance'}</th>
                <th className="px-4 py-2 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accounts.data.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-2">{a.code}</td>
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2 capitalize">{a.type}</td>
                  <td className="px-4 py-2">{a.is_closed ? t('closed') : t('open')}</td>
                  <td className="px-4 py-2 text-right">{currency(balances[a.id] ?? 0)}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <Link href={route('accounts.show', a.id)} className="px-2 py-1 text-indigo-700 hover:underline">{t('view_history')}</Link>
                    <Link as="button" method="delete" href={route('accounts.destroy', a.id)} className="px-2 py-1 text-red-700 hover:underline" onBefore={(e)=>{ if(!confirm(t('delete_account_confirm'))) e.preventDefault(); }}>{t('delete')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500">{t('page_of', { current: accounts.current_page, last: accounts.last_page })}</div>
      </div>
    </AuthenticatedLayout>
  );
}
