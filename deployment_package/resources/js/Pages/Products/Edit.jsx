import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { formatPKR } from '@/lib/currency';

export default function Edit({ product }) {
  const { data, setData, put, processing, errors } = useForm({
    name: product.name, sku: product.sku, description: product.description||'', price: product.price, stock: product.stock, tax_rate: product.tax_rate, is_active: product.is_active,
  });
  const submit = (e) => {
    e.preventDefault();
    put(route('products.update', product.id));
  };
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Edit Product</h2>}>
      <Head title={`Edit ${product.name}`} />
      <div className="mx-auto max-w-3xl p-6">
        <form onSubmit={submit} className="space-y-4 bg-white p-6 shadow rounded">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded border p-2" value={data.name} onChange={e=>setData('name', e.target.value)} />
            {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium">SKU</label>
            <input className="mt-1 w-full rounded border p-2" value={data.sku} onChange={e=>setData('sku', e.target.value)} />
            {errors.sku && <div className="text-sm text-red-600">{errors.sku}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea className="mt-1 w-full rounded border p-2" value={data.description} onChange={e=>setData('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input type="number" step="0.01" className="mt-1 w-full rounded border p-2" value={data.price} onChange={e=>setData('price', e.target.value)} />
              <div className="mt-1 text-xs text-gray-600">{formatPKR(Number(data.price||0))}</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Stock</label>
              <input type="number" className="mt-1 w-full rounded border p-2" value={data.stock} onChange={e=>setData('stock', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Tax %</label>
              <input type="number" step="0.01" className="mt-1 w-full rounded border p-2" value={data.tax_rate} onChange={e=>setData('tax_rate', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={data.is_active} onChange={e=>setData('is_active', e.target.checked)} className="me-2" /> Active
            </label>
            <div className="space-x-2">
              <Link href={route('products.index')} className="rounded border px-4 py-2">Cancel</Link>
              <button disabled={processing} className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
            </div>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
