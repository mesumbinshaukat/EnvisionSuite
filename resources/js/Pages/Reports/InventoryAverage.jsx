import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import Tooltip from '@/Components/Tooltip';
import Currency from '@/Components/Currency';

export default function InventoryAverage({ filters = {}, products, options }) {
  const { data, setData, get, processing } = useForm({
    from: filters.from || '',
    to: filters.to || '',
    product_id: filters.product_id || '',
    vendor_id: filters.vendor_id || '',
  });

  const submit = (e) => {
    e.preventDefault();
    get(route('reports.inventoryAverage'));
  };

  const rows = useMemo(() => products?.data || [], [products]);

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Inventory Average Cost</h2>}
    >
      <Head title="Inventory Average Cost" />
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <form onSubmit={submit} className="rounded bg-white p-4 shadow space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">From <Tooltip text="Start date to include purchases.">i</Tooltip></label>
              <input type="date" value={data.from} onChange={(e)=>setData('from', e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">To <Tooltip text="End date to include purchases.">i</Tooltip></label>
              <input type="date" value={data.to} onChange={(e)=>setData('to', e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">Product <Tooltip text="Filter by product.">i</Tooltip></label>
              <select value={data.product_id} onChange={(e)=>setData('product_id', e.target.value)} className="w-full rounded border px-3 py-2">
                <option value="">All</option>
                {options?.products?.map(p=> (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">Vendor <Tooltip text="Filter by vendor who supplied purchases.">i</Tooltip></label>
              <select value={data.vendor_id} onChange={(e)=>setData('vendor_id', e.target.value)} className="w-full rounded border px-3 py-2">
                <option value="">All</option>
                {options?.vendors?.map(v=> (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={processing} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Apply Filters</button>
            <Link href={route('reports.inventoryAverage')} className="rounded border px-4 py-2">Reset</Link>
          </div>
        </form>

        <div className="rounded bg-white p-4 shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-2">Product <Tooltip text="Product name and SKU.">i</Tooltip></th>
                <th className="px-2 py-2 text-right">Stock <Tooltip text="Current on-hand stock.">i</Tooltip></th>
                <th className="px-2 py-2 text-right">Old Qty <Tooltip text="Quantity from previous batches.">i</Tooltip></th>
                <th className="px-2 py-2 text-right">Old Unit Cost <Tooltip text="Estimated average cost for previous batches.">i</Tooltip></th>
                <th className="px-2 py-2 text-right">New Qty <Tooltip text="Quantity in the most recent batch.">i</Tooltip></th>
                <th className="px-2 py-2 text-right">New Unit Cost <Tooltip text="Unit cost of the most recent batch.">i</Tooltip></th>
                <th className="px-2 py-2 text-right">Weighted Avg Cost <Tooltip text="Weighted by purchase quantities across batches in range.">i</Tooltip></th>
                <th className="px-2 py-2 text-right">Change <Tooltip text="New Unit Cost minus Old Unit Cost. Red=up, Green=down.">i</Tooltip></th>
                <th className="px-2 py-2">Last Purchased <Tooltip text="Timestamp of the latest purchase in range.">i</Tooltip></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-2 py-6 text-center text-gray-500">No data</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-2 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{r.name}</span>
                      {r.sku && <span className="text-xs text-gray-500">SKU: {r.sku}</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right">{r.stock}</td>
                  <td className="px-2 py-2 text-right">{r.old_qty}</td>
                  <td className="px-2 py-2 text-right"><Currency value={r.old_unit_cost} /></td>
                  <td className="px-2 py-2 text-right">{r.new_qty}</td>
                  <td className="px-2 py-2 text-right"><Currency value={r.new_unit_cost} /></td>
                  <td className="px-2 py-2 text-right"><Currency value={r.weighted_avg_unit_cost} /></td>
                  <td className={`px-2 py-2 text-right ${r.price_change > 0 ? 'text-red-600' : (r.price_change < 0 ? 'text-green-600' : '')}`}><Currency value={r.price_change} /></td>
                  <td className="px-2 py-2">{r.last_purchase_at || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Showing {products.from} - {products.to} of {products.total}</div>
            <div className="flex items-center gap-2">
              {products.links?.map((l, i) => (
                <Link key={i} href={l.url || '#'} className={`px-3 py-1 rounded border ${l.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700'}`} dangerouslySetInnerHTML={{ __html: l.label }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
