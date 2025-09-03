import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useI18n } from '@/i18n';

export default function VendorDebtPurchases({ auth, filters = {}, vendors = [], purchases, totals = { total: 0, paid: 0, unpaid: 0 }, options = { vendors: [], statuses: [] } }) {
  const { t } = useI18n();

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const onFilterChange = (field, value) => {
    const params = { ...filters, [field]: value || undefined };
    router.get(route('reports.vendorDebtPurchases'), params, { preserveState: true, preserveScroll: true });
  };

  const statusOptions = options?.statuses?.length ? options.statuses : ['open','partial','paid'];
  const vendorOptions = options?.vendors || [];

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={t('Vendor Debt Purchase')} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t('Vendor Debt Purchase')}</h1>
          <Link href={route('reports.purchases')} className="px-3 py-2 bg-gray-100 rounded">{t('purchases_report')}</Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('vendor')}</label>
            <select className="w-full border rounded px-3 py-2" value={filters.vendor_id ?? ''} onChange={e=>onFilterChange('vendor_id', e.target.value)}>
              <option value="">{t('all')}</option>
              {vendorOptions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('status')}</label>
            <select className="w-full border rounded px-3 py-2" value={filters.status ?? ''} onChange={e=>onFilterChange('status', e.target.value)}>
              <option value="">{t('unpaid_only')}</option>
              {statusOptions.map(s => <option key={s} value={s}>{t(s)}</option>)}
            </select>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-gray-500">{t('total')}</div>
            <div className="text-lg font-semibold">{fmt(totals.total)}</div>
          </div>
          <div className="border rounded p-3 bg-green-50">
            <div className="text-gray-600">{t('paid')}</div>
            <div className="text-lg font-semibold text-green-700">{fmt(totals.paid)}</div>
          </div>
          <div className="border rounded p-3 bg-amber-50">
            <div className="text-gray-700">{t('unpaid')}</div>
            <div className="text-lg font-semibold text-amber-700">{fmt(totals.unpaid)}</div>
          </div>
        </div>

        {/* Per-vendor list */}
        <div className="bg-white rounded shadow">
          <div className="p-3 border-b font-medium">{t('vendors')}</div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{t('vendor')}</th>
                  <th className="px-3 py-2">{t('total')}</th>
                  <th className="px-3 py-2">{t('paid')}</th>
                  <th className="px-3 py-2">{t('unpaid')}</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 && (
                  <tr><td className="px-3 py-3 text-sm text-gray-500" colSpan={5}>{t('no_data')}</td></tr>
                )}
                {vendors.map((v, idx) => (
                  <tr key={v.vendor_id} className="border-t">
                    <td className="px-3 py-2 text-sm">{idx + 1}</td>
                    <td className="px-3 py-2 text-sm">
                      <button className="text-indigo-600 hover:underline" onClick={()=>onFilterChange('vendor_id', v.vendor_id)}>
                        {v.vendor_name || ('#'+v.vendor_id)}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-sm">{fmt(v.total_sum)}</td>
                    <td className="px-3 py-2 text-sm">{fmt(v.paid_sum)}</td>
                    <td className="px-3 py-2 text-sm font-semibold">{fmt(v.unpaid_sum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchases table */}
        <div className="bg-white rounded shadow">
          <div className="p-3 border-b font-medium">{t('purchases')}</div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{t('date')}</th>
                  <th className="px-3 py-2">{t('vendor')}</th>
                  <th className="px-3 py-2">{t('total')}</th>
                  <th className="px-3 py-2">{t('paid')}</th>
                  <th className="px-3 py-2">{t('unpaid')}</th>
                  <th className="px-3 py-2">{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases?.data?.length === 0 && (
                  <tr><td className="px-3 py-3 text-sm text-gray-500" colSpan={7}>{t('no_data')}</td></tr>
                )}
                {purchases?.data?.map((p, idx) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 text-sm">{p.id}</td>
                    <td className="px-3 py-2 text-sm">{p.date}</td>
                    <td className="px-3 py-2 text-sm">{p.vendor}</td>
                    <td className="px-3 py-2 text-sm">{fmt(p.grand_total)}</td>
                    <td className="px-3 py-2 text-sm">{fmt(p.amount_paid)}</td>
                    <td className="px-3 py-2 text-sm font-semibold">{fmt(p.unpaid)}</td>
                    <td className="px-3 py-2 text-sm">{t(p.status || 'unknown')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {purchases?.links && (
            <div className="p-3 flex items-center gap-2">
              {purchases.links.map((l, i) => (
                <button key={i} disabled={!l.url} onClick={()=> l.url && router.visit(l.url, { preserveScroll: true, preserveState: true })}
                  className={`px-3 py-1 rounded text-sm ${l.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                  dangerouslySetInnerHTML={{ __html: l.label }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
