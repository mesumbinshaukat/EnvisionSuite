import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Create({ auth, products }) {
  const { data, setData, post, processing, errors } = useForm({
    product_id: '',
    type: 'adjustment',
    quantity_change: 0,
    reference: '',
    notes: '',
  });
  const submit = (e) => { e.preventDefault(); post(route('inventory.adjustments.store')); };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="New Adjustment" />
      <form onSubmit={submit} className="p-6 space-y-4 max-w-xl">
        <h1 className="text-xl font-semibold">New Inventory Adjustment</h1>
        <div>
          <label className="block text-sm text-gray-600">Product</label>
          <select className="border rounded px-3 py-2 w-full" value={data.product_id} onChange={e=>setData('product_id', e.target.value)}>
            <option value="">Select...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
          {errors.product_id && <div className="text-red-600 text-sm">{errors.product_id}</div>}
        </div>
        <div>
          <label className="block text-sm text-gray-600">Type</label>
          <select className="border rounded px-3 py-2 w-full" value={data.type} onChange={e=>setData('type', e.target.value)}>
            <option value="adjustment">Adjustment</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="return">Return</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Quantity Change</label>
          <input type="number" className="border rounded px-3 py-2 w-full" value={data.quantity_change} onChange={e=>setData('quantity_change', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Reference</label>
          <input className="border rounded px-3 py-2 w-full" value={data.reference} onChange={e=>setData('reference', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Notes</label>
          <textarea className="border rounded px-3 py-2 w-full" value={data.notes} onChange={e=>setData('notes', e.target.value)} />
        </div>
        <button disabled={processing} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Save</button>
      </form>
    </AuthenticatedLayout>
  );
}
