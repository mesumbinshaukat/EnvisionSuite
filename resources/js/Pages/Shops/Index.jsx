import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Index({ auth, shops, currentShopId }) {
  const { post } = useForm();
  const switchShop = (id) => post(route('shops.switch', id));
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Shops" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Shops</h1>
          <Link href={route('shops.create')} className="px-3 py-2 rounded bg-emerald-500 text-white hover:bg-emerald-600">Create Shop</Link>
        </div>
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shops.map(s => (
                <tr key={s.id} className={currentShopId === s.id ? 'bg-green-50' : ''}>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.code}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => switchShop(s.id)} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
                      {currentShopId === s.id ? 'Active' : 'Switch'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
