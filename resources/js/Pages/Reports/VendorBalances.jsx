import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';

export default function VendorBalances({ auth, vendors, totalBalance }) {
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Vendor Balances" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Vendor Balances</h1>
          <Link href={route('reports.accounting.vendorBalances.export')} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Export Excel</Link>
        </div>
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Vendor</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendors.data.map(v => (
                <tr key={v.id}>
                  <td className="px-4 py-2">{v.name}</td>
                  <td className="px-4 py-2">{v.email || '-'}</td>
                  <td className="px-4 py-2">{v.phone || '-'}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(v.balance || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>Page {vendors.current_page} of {vendors.last_page}</div>
          <div className="font-medium">Total Balance: {formatPKR(Number(totalBalance || 0))}</div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
