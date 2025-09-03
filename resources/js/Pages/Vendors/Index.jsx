import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useI18n } from '@/i18n';
import Tooltip from '@/Components/Tooltip';

export default function Index({ auth, vendors }) {
  const { flash } = usePage().props;
  const { t } = useI18n();
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('vendors')} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{t('vendors')}</h1>
          <Link href={route('vendors.create')} className="px-3 py-2 rounded bg-emerald-500 text-white hover:bg-emerald-600">
            <Tooltip text={t('create_new_vendor_tip') || t('new_vendor')}>{t('new_vendor')}</Tooltip>
          </Link>
        </div>
        {flash?.success && <div className="mb-3 text-green-600">{flash.success}</div>}
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">{t('name')}</th>
                <th className="px-4 py-2 text-left">{t('email')}</th>
                <th className="px-4 py-2 text-left">{t('phone')}</th>
                <th className="px-4 py-2 text-left">{t('balance')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendors.data.map(v => (
                <tr key={v.id}>
                  <td className="px-4 py-2">{v.name}</td>
                  <td className="px-4 py-2">{v.email || '-'}</td>
                  <td className="px-4 py-2">{v.phone || '-'}</td>
                  <td className="px-4 py-2">{Number(v.balance || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <Link className="px-2 py-1 bg-gray-200 rounded" href={route('vendors.edit', v.id)}>
                      <Tooltip text={t('edit_vendor_tip') || t('edit')}>{t('edit')}</Tooltip>
                    </Link>
                    <Link className="px-2 py-1 bg-red-600 text-white rounded" method="delete" as="button" href={route('vendors.destroy', v.id)}>
                      <Tooltip text={t('delete_vendor_tip') || t('delete')}>{t('delete')}</Tooltip>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">{t('showing_from_to_of', {from: vendors.from, to: vendors.to, total: vendors.total}) || `Showing ${vendors.from} - ${vendors.to} of ${vendors.total}`}</div>
          <div className="flex items-center gap-2">
            {vendors.links?.map((l, i) => (
              <Link key={i} href={l.url || '#'} className={`px-3 py-1 rounded border ${l.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700'}`} dangerouslySetInnerHTML={{ __html: l.label }} />
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
