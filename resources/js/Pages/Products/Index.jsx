import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Index({ products }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Products</h2>}>
      <Head title="Products" />
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-4 flex justify-between">
          <Link href={route('products.create')} className="rounded bg-blue-600 px-4 py-2 text-white">New Product</Link>
        </div>
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.data.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.sku}</td>
                  <td className="px-4 py-2 text-right">{p.price}</td>
                  <td className="px-4 py-2 text-right">{p.stock}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={route('products.edit', p.id)} className="text-blue-600 hover:underline">Edit</Link>
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
