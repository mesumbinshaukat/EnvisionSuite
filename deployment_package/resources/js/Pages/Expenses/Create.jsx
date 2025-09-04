import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import Tooltip from '@/Components/Tooltip';

export default function Create({ auth }) {
  const { data, setData, post, processing, errors } = useForm({
    date: new Date().toISOString().slice(0,10),
    amount: '',
    payment_method: 'cash',
    notes: '',
  });

  const submit = (e) => { e.preventDefault(); post(route('expenses.store')); };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Add Expense" />
      <div className="p-6 space-y-6 max-w-2xl">
        <h1 className="text-xl font-semibold flex items-center gap-2">Add Expense <Tooltip text={"Record an expense. Amount is in Pakistani Rupees (Rs). Notes are optional."} /></h1>
        <form onSubmit={submit} className="space-y-4 bg-white p-4 rounded shadow">
          <div>
            <label className="block text-sm text-gray-600 mb-1 flex items-center gap-2">Date <Tooltip text={"Expense date."} /></label>
            <input type="date" className="w-full border rounded px-3 py-2" value={data.date} onChange={e=>setData('date', e.target.value)} />
            {errors.date && <div className="text-red-600 text-sm mt-1">{errors.date}</div>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1 flex items-center gap-2">Amount (PKR) <Tooltip text={"Amount in PKR (Rs)."} /></label>
            <input type="number" step="0.01" min="0" className="w-full border rounded px-3 py-2" value={data.amount} onChange={e=>setData('amount', e.target.value)} placeholder="0.00" />
            {errors.amount && <div className="text-red-600 text-sm mt-1">{errors.amount}</div>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1 flex items-center gap-2">Payment Method <Tooltip text={"Select how this expense was paid: cash, card, bank transfer, or credited (on account)."} /></label>
            <select className="w-full border rounded px-3 py-2" value={data.payment_method} onChange={e=>setData('payment_method', e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credited">Credited</option>
            </select>
            {errors.payment_method && <div className="text-red-600 text-sm mt-1">{errors.payment_method}</div>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1 flex items-center gap-2">Notes <Tooltip text={"Optional note for clarity (e.g., utility bill, rent)."} /></label>
            <input type="text" className="w-full border rounded px-3 py-2" value={data.notes} onChange={e=>setData('notes', e.target.value)} placeholder="Optional" />
            {errors.notes && <div className="text-red-600 text-sm mt-1">{errors.notes}</div>}
          </div>
          <div className="flex gap-2">
            <button disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded">Save Expense</button>
            <Link href={route('expenses.index')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded">Cancel</Link>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
