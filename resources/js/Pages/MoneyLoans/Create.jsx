import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useI18n } from '@/i18n';

export default function Create({ auth, vendors }) {
  const { t } = useI18n();
  const { data, setData, post, processing, errors } = useForm({
    counterparty_type: 'vendor',
    vendor_id: vendors?.[0]?.id ?? '',
    counterparty_name: '',
    direction: 'lend',
    source: 'cash',
    amount: '',
    date: new Date().toISOString().slice(0,10),
    note: '',
  });

  const onSubmit = (e) => {
    e.preventDefault();
    post(route('money.loans.store'));
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={t('new_money_loan')} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" data-help-key="money_loans_create_title">{t('record_money_loan')}</h1>
          <Link href={route('money.loans.index')} className="px-3 py-2 bg-gray-100 rounded">{t('back')}</Link>
        </div>

        <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="money_loans_counterparty_type">{t('counterparty_type')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.counterparty_type} onChange={e=>setData('counterparty_type', e.target.value)}>
                <option value="vendor">{t('vendor')}</option>
                <option value="external">{t('external_person')}</option>
              </select>
              {errors.counterparty_type && <div className="text-sm text-red-600 mt-1">{errors.counterparty_type}</div>}
            </div>

            {data.counterparty_type === 'vendor' ? (
              <div>
                <label className="block text-sm text-gray-600 mb-1" data-help-key="money_loans_vendor">{t('vendor')}</label>
                <select className="w-full border rounded px-3 py-2" value={data.vendor_id ?? ''} onChange={e=>setData('vendor_id', e.target.value)}>
                  {(vendors || []).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                {errors.vendor_id && <div className="text-sm text-red-600 mt-1">{errors.vendor_id}</div>}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-600 mb-1" data-help-key="money_loans_counterparty_name">{t('external_person')}</label>
                <input className="w-full border rounded px-3 py-2" value={data.counterparty_name} onChange={e=>setData('counterparty_name', e.target.value)} />
                {errors.counterparty_name && <div className="text-sm text-red-600 mt-1">{errors.counterparty_name}</div>}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="money_loans_direction">{t('direction')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.direction} onChange={e=>setData('direction', e.target.value)}>
                <option value="lend">{t('lend')}</option>
                <option value="borrow">{t('borrow')}</option>
              </select>
              {errors.direction && <div className="text-sm text-red-600 mt-1">{errors.direction}</div>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="money_loans_source">{t('source')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.source} onChange={e=>setData('source', e.target.value)}>
                <option value="cash">{t('cash')}</option>
                <option value="bank">{t('bank')}</option>
              </select>
              {errors.source && <div className="text-sm text-red-600 mt-1">{errors.source}</div>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="money_loans_amount">{t('amount')}</label>
              <input type="number" step="0.01" min="0" className="w-full border rounded px-3 py-2" value={data.amount} onChange={e=>setData('amount', e.target.value)} />
              {errors.amount && <div className="text-sm text-red-600 mt-1">{errors.amount}</div>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="money_loans_date">{t('date')}</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={data.date} onChange={e=>setData('date', e.target.value)} />
              {errors.date && <div className="text-sm text-red-600 mt-1">{errors.date}</div>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1" data-help-key="money_loans_note">{t('note')}</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={data.note} onChange={e=>setData('note', e.target.value)} />
            {errors.note && <div className="text-sm text-red-600 mt-1">{errors.note}</div>}
          </div>

          <div className="flex items-center gap-3">
            <button disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">{t('save')}</button>
            <Link href={route('money.loans.index')} className="px-4 py-2 bg-gray-100 rounded">{t('cancel')}</Link>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
