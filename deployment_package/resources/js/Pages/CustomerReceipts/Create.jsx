import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create({ auth, customers }) {
  const { data, setData, post, processing, errors } = useForm({
    customer_id: '',
    date: new Date().toISOString().slice(0,10),
    amount: '',
    payment_method: 'cash',
    notes: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('customer-receipts.store'));
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <div className="p-4 max-w-xl">
        <h1 className="text-xl font-semibold mb-4">Record Customer Receipt</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm">Customer</label>
            <select className="w-full border rounded p-2" value={data.customer_id} onChange={e=>setData('customer_id', e.target.value)}>
              <option value="">Select customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.customer_id && <div className="text-red-600 text-sm">{errors.customer_id}</div>}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm">Date</label>
              <input type="date" className="w-full border rounded p-2" value={data.date} onChange={e=>setData('date', e.target.value)} />
              {errors.date && <div className="text-red-600 text-sm">{errors.date}</div>}
            </div>
            <div className="flex-1">
              <label className="block text-sm">Amount</label>
              <input type="number" step="0.01" className="w-full border rounded p-2" value={data.amount} onChange={e=>setData('amount', e.target.value)} />
              {errors.amount && <div className="text-red-600 text-sm">{errors.amount}</div>}
            </div>
          </div>
          <div>
            <label className="block text-sm">Payment Method</label>
            <select className="w-full border rounded p-2" value={data.payment_method} onChange={e=>setData('payment_method', e.target.value)}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
            </select>
            {errors.payment_method && <div className="text-red-600 text-sm">{errors.payment_method}</div>}
          </div>
          <div>
            <label className="block text-sm">Notes</label>
            <input type="text" className="w-full border rounded p-2" value={data.notes} onChange={e=>setData('notes', e.target.value)} />
          </div>
          <div className="pt-2">
            <button disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
