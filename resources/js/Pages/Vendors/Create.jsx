import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ auth }) {
  const { data, setData, post, processing, errors } = useForm({
    name: '', email: '', phone: '', address: '', balance: ''
  });
  const submit = (e) => { e.preventDefault(); post(route('vendors.store')); };
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="New Vendor" />
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">New Vendor</h1>
          <Link href={route('vendors.index')} className="px-3 py-2 rounded bg-gray-200 text-gray-800">Back</Link>
        </div>
        <form onSubmit={submit} className="space-y-4 bg-white shadow rounded p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input className="mt-1 block w-full border-gray-300 rounded" value={data.name} onChange={e=>setData('name', e.target.value)} required />
            {errors.name && <div className="text-sm text-red-600 mt-1">{errors.name}</div>}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input className="mt-1 block w-full border-gray-300 rounded" type="email" value={data.email} onChange={e=>setData('email', e.target.value)} />
              {errors.email && <div className="text-sm text-red-600 mt-1">{errors.email}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input className="mt-1 block w-full border-gray-300 rounded" value={data.phone} onChange={e=>setData('phone', e.target.value)} />
              {errors.phone && <div className="text-sm text-red-600 mt-1">{errors.phone}</div>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input className="mt-1 block w-full border-gray-300 rounded" value={data.address} onChange={e=>setData('address', e.target.value)} />
            {errors.address && <div className="text-sm text-red-600 mt-1">{errors.address}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Opening Balance</label>
            <input className="mt-1 block w-full border-gray-300 rounded" type="number" step="0.01" value={data.balance} onChange={e=>setData('balance', e.target.value)} />
            {errors.balance && <div className="text-sm text-red-600 mt-1">{errors.balance}</div>}
          </div>
          <div className="pt-2">
            <button type="submit" disabled={processing} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {processing ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
