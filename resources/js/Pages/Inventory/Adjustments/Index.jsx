import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ auth, movements }) {
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Inventory Adjustments" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Inventory Adjustments</h1>
          <Link href={route('inventory.adjustments.create')} className="px-4 py-2 rounded bg-blue-600 text-white">New Adjustment</Link>
        </div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(movements.data || []).map(m => (
                <tr key={m.id}>
                  <td className="px-4 py-2">{m.product?.name ?? m.product_id}</td>
                  <td className="px-4 py-2">{m.type}</td>
                  <td className="px-4 py-2">{m.quantity_change}</td>
                  <td className="px-4 py-2">{m.reference || '-'}</td>
                  <td className="px-4 py-2">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
