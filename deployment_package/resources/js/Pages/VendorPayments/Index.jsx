import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ auth, payments }) {
  return (
    <AuthenticatedLayout user={auth?.user}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Vendor Payments</h1>
          <a href={route('vendor-payments.create')} className="px-3 py-2 bg-indigo-600 text-white rounded">New Payment</a>
        </div>
        <div className="bg-white shadow rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-2">Date</th>
                <th className="p-2">Vendor</th>
                <th className="p-2">Method</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments?.data?.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.date}</td>
                  <td className="p-2">{p.vendor?.name}</td>
                  <td className="p-2">{p.payment_method}</td>
                  <td className="p-2 text-right">{Number(p.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
