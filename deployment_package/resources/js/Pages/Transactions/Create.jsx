import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useI18n } from '@/i18n';

export default function Create({ auth, vendors, vendorDebts = {}, balances = {} }) {
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
    purpose: 'general',
  });

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const selectedVendorDebt = useMemo(()=>{
    const vid = data.vendor_id ? Number(data.vendor_id) : null;
    if (!vid) return 0;
    const raw = vendorDebts?.[vid] ?? 0;
    return Number(raw || 0);
  }, [data.vendor_id, vendorDebts]);
  const availableSource = data.source === 'bank' ? Number(balances?.bank || 0) : Number(balances?.cash || 0);

  const onSubmit = (e) => {
    e.preventDefault();
    const amt = Number(data.amount || 0);
    if (amt <= 0) {
      alert(t('amount') + ' ' + t('must_be_positive'));
      return;
    }
    if ((data.direction === 'lend' || data.purpose === 'vendor_payoff') && amt > availableSource + 1e-6) {
      alert(t('insufficient_funds') + `: ${t(data.source)} ${fmt(availableSource)}`);
      return;
    }
    if (data.purpose === 'vendor_payoff') {
      if (data.counterparty_type !== 'vendor' || !data.vendor_id) {
        alert(t('vendor') + ' ' + t('is_required'));
        return;
      }
      if (amt > selectedVendorDebt + 1e-6) {
        alert(t('amount') + ' > ' + t('Pending Debt') + ` (${fmt(selectedVendorDebt)})`);
        return;
      }
      if (selectedVendorDebt <= 0) {
        alert(t('No Pending Debt For Selected Vendor'));
        return;
      }
    }
    post(route('transactions.store'));
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={t('transactions')} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" data-help-key="transactions_create_title">{t('transactions')}</h1>
          <Link href={route('transactions.index')} className="px-3 py-2 bg-gray-100 rounded">{t('back')}</Link>
        </div>

        <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow space-y-4 max-w-2xl">
          {/* Balances and Vendor Debt context */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded border bg-gray-50">
              <div className="text-gray-500">{t('cash')} {t('balance')}</div>
              <div className="font-semibold">{fmt(balances?.cash)}</div>
            </div>
            <div className="p-3 rounded border bg-gray-50">
              <div className="text-gray-500">{t('bank')} {t('balance')}</div>
              <div className="font-semibold">{fmt(balances?.bank)}</div>
            </div>
            {data.counterparty_type === 'vendor' && (
              <div className="p-3 rounded border bg-amber-50">
                <div className="text-gray-600">{t('Pending Debt')}</div>
                <div className="font-semibold">{fmt(selectedVendorDebt)}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_counterparty_type">{t('counterparty_type')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.counterparty_type} onChange={e=>setData('counterparty_type', e.target.value)}>
                <option value="vendor">{t('vendor')}</option>
                <option value="external">{t('external_person')}</option>
              </select>
              {errors.counterparty_type && <div className="text-sm text-red-600 mt-1">{errors.counterparty_type}</div>}
            </div>

            {data.counterparty_type === 'vendor' ? (
              <div>
                <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_vendor">{t('vendor')}</label>
                <select className="w-full border rounded px-3 py-2" value={data.vendor_id ?? ''} onChange={e=>setData('vendor_id', e.target.value)}>
                  {(vendors || []).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                {errors.vendor_id && <div className="text-sm text-red-600 mt-1">{errors.vendor_id}</div>}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_counterparty_name">{t('external_person')}</label>
                <input className="w-full border rounded px-3 py-2" value={data.counterparty_name} onChange={e=>setData('counterparty_name', e.target.value)} />
                {errors.counterparty_name && <div className="text-sm text-red-600 mt-1">{errors.counterparty_name}</div>}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_direction">{t('direction')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.direction} onChange={e=>setData('direction', e.target.value)}>
                <option value="lend">{t('lend')}</option>
                <option value="borrow">{t('borrow')}</option>
              </select>
              {errors.direction && <div className="text-sm text-red-600 mt-1">{errors.direction}</div>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_purpose">{t('purpose')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.purpose} onChange={e=>setData('purpose', e.target.value)}>
                <option value="general">{t('general')}</option>
                <option value="vendor_payoff">{t('Payoff Vendor Debt')}</option>
              </select>
              {errors.purpose && <div className="text-sm text-red-600 mt-1">{errors.purpose}</div>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_source">{t('source')}</label>
              <select className="w-full border rounded px-3 py-2" value={data.source} onChange={e=>setData('source', e.target.value)}>
                <option value="cash">{t('cash')}</option>
                <option value="bank">{t('bank')}</option>
              </select>
              {errors.source && <div className="text-sm text-red-600 mt-1">{errors.source}</div>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_amount">{t('amount')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={data.amount}
                onChange={e=>setData('amount', e.target.value)}
                max={data.purpose === 'vendor_payoff' ? selectedVendorDebt : undefined}
              />
              {errors.amount && <div className="text-sm text-red-600 mt-1">{errors.amount}</div>}
              {(data.direction === 'lend' || data.purpose === 'vendor_payoff') && (
                <div className="text-xs text-gray-500 mt-1">{t('available')} {t(data.source)}: {fmt(availableSource)}</div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_date">{t('date')}</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={data.date} onChange={e=>setData('date', e.target.value)} />
              {errors.date && <div className="text-sm text-red-600 mt-1">{errors.date}</div>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1" data-help-key="transactions_note">{t('note')}</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={data.note} onChange={e=>setData('note', e.target.value)} />
            {errors.note && <div className="text-sm text-red-600 mt-1">{errors.note}</div>}
          </div>

          <div className="flex items-center gap-3">
            <button disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">{t('save')}</button>
            <Link href={route('transactions.index')} className="px-4 py-2 bg-gray-100 rounded">{t('cancel')}</Link>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
