import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';

export default function Show({ product }) {
  if (!product) return null;
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Product Details</h2>}>
      <Head title={`Product • ${product.name}`} />
      <div className="mx-auto max-w-4xl p-6">
        <div className="bg-white shadow rounded p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="text-lg font-medium">{product.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">SKU</div>
              <div className="text-lg font-medium">{product.sku}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Price</div>
              <div className="text-lg font-medium">{formatPKR(Number(product.price || 0))}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Stock</div>
              <div className="text-lg font-medium">{product.stock ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tax Rate</div>
              <div className="text-lg font-medium">{Number(product.tax_rate || 0)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          {product.description && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Description</div>
              <div className="mt-1 whitespace-pre-wrap">{product.description}</div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Link href={route('products.index')} className="rounded border px-4 py-2">Back</Link>
          <Link href={route('products.edit', product.id)} className="rounded bg-blue-600 px-4 py-2 text-white">Edit</Link>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
