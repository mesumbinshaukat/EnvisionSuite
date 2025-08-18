import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ auth, loans }) {
  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title="Inventory Loans" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Inventory Loans</h1>
          <Link href={route('inventory.loans.create')} className="px-4 py-2 bg-blue-600 text-white rounded">New Loan</Link>
        </div>

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Returned</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Outstanding</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Counterparty</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(loans.data || []).map(ln => (
                <tr key={ln.id}>
                  <td className="px-4 py-2">{ln.id}</td>
                  <td className="px-4 py-2">{ln.product?.name ?? ln.product_id}</td>
                  <td className="px-4 py-2">{ln.quantity}</td>
                  <td className="px-4 py-2">{ln.returned_quantity}</td>
                  <td className="px-4 py-2">{Math.max(0, (ln.quantity ?? 0) - (ln.returned_quantity ?? 0))}</td>
                  <td className="px-4 py-2">
                    {ln.counterparty_type === 'shop' ? (ln.counterparty_shop?.name ?? 'Shop #' + ln.counterparty_shop_id) : (ln.counterparty_name ?? 'External')}
                  </td>
                  <td className="px-4 py-2">{ln.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
