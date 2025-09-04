import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    name:'', email:'', phone:'', address_line1:'', address_line2:'', city:'', state:'', postal_code:'', country:'', notes:'', is_active:true
  });
  const submit = (e)=>{ e.preventDefault(); post(route('customers.store')); };
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">New Customer</h2>}>
      <Head title="New Customer" />
      <div className="mx-auto max-w-3xl p-6">
        <form onSubmit={submit} className="space-y-4 bg-white p-6 shadow rounded">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded border p-2" value={data.name} onChange={e=>setData('name', e.target.value)} />
            {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input className="mt-1 w-full rounded border p-2" value={data.email} onChange={e=>setData('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input className="mt-1 w-full rounded border p-2" value={data.phone} onChange={e=>setData('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Address 1</label>
              <input className="mt-1 w-full rounded border p-2" value={data.address_line1} onChange={e=>setData('address_line1', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Address 2</label>
              <input className="mt-1 w-full rounded border p-2" value={data.address_line2} onChange={e=>setData('address_line2', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">City</label>
              <input className="mt-1 w-full rounded border p-2" value={data.city} onChange={e=>setData('city', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input className="mt-1 w-full rounded border p-2" value={data.state} onChange={e=>setData('state', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Postal Code</label>
              <input className="mt-1 w-full rounded border p-2" value={data.postal_code} onChange={e=>setData('postal_code', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Country</label>
            <input className="mt-1 w-full rounded border p-2" value={data.country} onChange={e=>setData('country', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea className="mt-1 w-full rounded border p-2" value={data.notes} onChange={e=>setData('notes', e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={data.is_active} onChange={e=>setData('is_active', e.target.checked)} className="me-2" /> Active
            </label>
            <div className="space-x-2">
              <Link href={route('customers.index')} className="rounded border px-4 py-2">Cancel</Link>
              <button disabled={processing} className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
            </div>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
