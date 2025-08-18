import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ auth, category }) {
  const { data, setData, put, processing, errors } = useForm({
    name: category.name || '',
    type: category.type || '',
    description: category.description || ''
  });
  const submit = (e) => { e.preventDefault(); put(route('categories.update', category.id)); };
  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Edit Category - ${category.name}`} />
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Edit Category</h1>
          <Link href={route('categories.index')} className="px-3 py-2 rounded bg-gray-200 text-gray-800">Back</Link>
        </div>
        <form onSubmit={submit} className="space-y-4 bg-white shadow rounded p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input className="mt-1 block w-full border-gray-300 rounded" value={data.name} onChange={e=>setData('name', e.target.value)} required />
            {errors.name && <div className="text-sm text-red-600 mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <input className="mt-1 block w-full border-gray-300 rounded" value={data.type} onChange={e=>setData('type', e.target.value)} />
            {errors.type && <div className="text-sm text-red-600 mt-1">{errors.type}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea className="mt-1 block w-full border-gray-300 rounded" rows={3} value={data.description} onChange={e=>setData('description', e.target.value)} />
            {errors.description && <div className="text-sm text-red-600 mt-1">{errors.description}</div>}
          </div>
          <div className="pt-2">
            <button type="submit" disabled={processing} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {processing ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
