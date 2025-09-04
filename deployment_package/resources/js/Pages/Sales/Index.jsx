import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ sales }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Sales</h2>}>
      <Head title="Sales" />
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-4 flex justify-between">
          <Link href={route('sales.create')} className="rounded bg-blue-600 px-4 py-2 text-white">New Sale</Link>
        </div>
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sales.data.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">#{s.id}</td>
                  <td className="px-4 py-2">{s.customer?.name || '-'}</td>
                  <td className="px-4 py-2 text-right">{s.total}</td>
                  <td className="px-4 py-2">{s.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={route('sales.show', s.id)} className="text-blue-600 hover:underline">View</Link>
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
