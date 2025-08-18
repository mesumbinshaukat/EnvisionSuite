import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ auth, products, shops }) {
  const { data, setData, post, processing, errors } = useForm({
    product_id: products?.[0]?.id ?? '',
    quantity: 1,
    counterparty_type: 'shop',
    counterparty_shop_id: shops?.[0]?.id ?? '',
    counterparty_name: '',
    notes: '',
  });

  const onSubmit = (e) => {
    e.preventDefault();
    post(route('inventory.loans.store'));
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title="New Inventory Loan" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Record Inventory Loan</h1>
          <Link href={route('inventory.loans.index')} className="px-3 py-2 bg-gray-100 rounded">Back</Link>
        </div>

        <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Product</label>
              <select className="w-full border rounded px-3 py-2" value={data.product_id} onChange={e=>setData('product_id', e.target.value)}>
                {(products || []).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.stock ?? 0}</option>
                ))}
              </select>
              {errors.product_id && <div className="text-sm text-red-600 mt-1">{errors.product_id}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Quantity</label>
              <input type="number" min="1" className="w-full border rounded px-3 py-2" value={data.quantity} onChange={e=>setData('quantity', e.target.value)} />
              {errors.quantity && <div className="text-sm text-red-600 mt-1">{errors.quantity}</div>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Counterparty Type</label>
              <select className="w-full border rounded px-3 py-2" value={data.counterparty_type} onChange={e=>setData('counterparty_type', e.target.value)}>
                <option value="shop">Shop</option>
                <option value="external">External</option>
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
              </select>
              {errors.counterparty_type && <div className="text-sm text-red-600 mt-1">{errors.counterparty_type}</div>}
            </div>
            {data.counterparty_type === 'shop' ? (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Shop</label>
                <select className="w-full border rounded px-3 py-2" value={data.counterparty_shop_id ?? ''} onChange={e=>setData('counterparty_shop_id', e.target.value)}>
                  {(shops || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.counterparty_shop_id && <div className="text-sm text-red-600 mt-1">{errors.counterparty_shop_id}</div>}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Counterparty Name</label>
                <input className="w-full border rounded px-3 py-2" value={data.counterparty_name} onChange={e=>setData('counterparty_name', e.target.value)} />
                {errors.counterparty_name && <div className="text-sm text-red-600 mt-1">{errors.counterparty_name}</div>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={data.notes} onChange={e=>setData('notes', e.target.value)} />
            {errors.notes && <div className="text-sm text-red-600 mt-1">{errors.notes}</div>}
          </div>

          <div className="flex items-center gap-3">
            <button disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">Save</button>
            <Link href={route('inventory.loans.index')} className="px-4 py-2 bg-gray-100 rounded">Cancel</Link>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
