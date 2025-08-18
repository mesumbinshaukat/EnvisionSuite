import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ customers }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Customers</h2>}>
      <Head title="Customers" />
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-4 flex justify-between">
          <Link href={route('customers.create')} className="rounded bg-blue-600 px-4 py-2 text-white">New Customer</Link>
        </div>
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {customers.data.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={route('customers.edit', c.id)} className="text-blue-600 hover:underline">Edit</Link>
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
