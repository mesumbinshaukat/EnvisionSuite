import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Index({ categories }) {
  const { flash, auth } = usePage().props;
  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title="Categories" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Categories</h1>
          <Link href={route('categories.create')} className="px-3 py-2 rounded bg-blue-600 text-white">New</Link>
        </div>
        {flash?.success && <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700">{flash.success}</div>}
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.data.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.type || '-'}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <Link className="px-3 py-1 rounded bg-gray-100" href={route('categories.edit', c.id)}>Edit</Link>
                    <Link className="px-3 py-1 rounded bg-red-600 text-white" method="delete" as="button" href={route('categories.destroy', c.id)}>Delete</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500">Page {categories.current_page} of {categories.last_page}</div>
      </div>
    </AuthenticatedLayout>
  );
}
