import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Index({ auth, vendors }) {
  const { flash } = usePage().props;
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Vendors" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Vendors</h1>
          <Link href={route('vendors.create')} className="px-3 py-2 rounded bg-emerald-500 text-white hover:bg-emerald-600">New Vendor</Link>
        </div>
        {flash?.success && <div className="mb-3 text-green-600">{flash.success}</div>}
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Balance</th>
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
                    <Link className="px-2 py-1 bg-gray-200 rounded" href={route('vendors.edit', v.id)}>Edit</Link>
                    <Link className="px-2 py-1 bg-red-600 text-white rounded" method="delete" as="button" href={route('vendors.destroy', v.id)}>Delete</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-gray-500">Page {vendors.current_page} of {vendors.last_page}</div>
      </div>
    </AuthenticatedLayout>
  );
}
