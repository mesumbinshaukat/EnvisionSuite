import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Index({ purchases, vendors = [], products = [], filters = {} }) {
  const { props } = usePage();
  const { data, setData, get } = useForm({
    vendor_id: filters.vendor_id || '',
    status: filters.status || '',
    product_id: filters.product_id || '',
    start_date: filters.start_date || '',
    end_date: filters.end_date || '',
  });
  const submit = (e) => {
    e.preventDefault();
    get(route('purchases.index'), { preserveScroll: true, preserveState: true });
  };
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Purchases</h2>}>
      <Head title="Purchases" />
      <div className="mx-auto max-w-7xl p-6 space-y-4">
        <div className="flex justify-between items-end gap-4 flex-wrap">
          <Link href={route('purchases.create')} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">New Purchase</Link>
          <form onSubmit={submit} className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-xs text-gray-600">Vendor</label>
              <select className="rounded border-gray-300 text-sm" value={data.vendor_id} onChange={e=>setData('vendor_id', e.target.value)}>
                <option value="">All</option>
                {vendors.map(v => (<option key={v.id} value={v.id}>{v.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Status</label>
              <select className="rounded border-gray-300 text-sm" value={data.status} onChange={e=>setData('status', e.target.value)}>
                <option value="">All</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="open">Open</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Product</label>
              <select className="rounded border-gray-300 text-sm" value={data.product_id} onChange={e=>setData('product_id', e.target.value)}>
                <option value="">All</option>
                {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600">From</label>
              <input type="date" className="rounded border-gray-300 text-sm" value={data.start_date} onChange={e=>setData('start_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600">To</label>
              <input type="date" className="rounded border-gray-300 text-sm" value={data.end_date} onChange={e=>setData('end_date', e.target.value)} />
            </div>
            <button type="submit" className="rounded bg-gray-100 px-3 py-2 text-sm">Filter</button>
          </form>
        </div>
        <div className="overflow-x-auto rounded bg-white p-4 shadow">
          <table className="min-w-full">
            <thead><tr><th className="px-2 py-2 text-left">#</th><th className="px-2 py-2">Vendor</th><th className="px-2 py-2 text-right">Grand Total</th><th className="px-2 py-2 text-right">Paid</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Date</th></tr></thead>
            <tbody>
              {purchases.data.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-2 py-2">{p.id}</td>
                  <td className="px-2 py-2">{p.vendor?.name ?? p.vendor_name ?? '-'}</td>
                  <td className="px-2 py-2 text-right">{p.grand_total}</td>
                  <td className="px-2 py-2 text-right">{p.amount_paid}</td>
                  <td className="px-2 py-2">{p.status}</td>
                  <td className="px-2 py-2">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases?.links && (
            <div className="p-3 border-t flex gap-2 flex-wrap">
              {purchases.links.map((l, idx) => (
                <a key={idx} href={l.url || '#'} className={`px-2 py-1 rounded ${l.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'} ${!l.url ? 'opacity-60 pointer-events-none' : ''}`}
                  dangerouslySetInnerHTML={{ __html: l.label }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
