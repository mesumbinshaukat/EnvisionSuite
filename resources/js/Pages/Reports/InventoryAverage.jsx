import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import Tooltip from '@/Components/Tooltip';
import Currency from '@/Components/Currency';

function Sparkline({ points = [], width = 300, height = 60, stroke = '#4f46e5' }) {
  const costs = points.map(p => Number(p.unit_cost || 0));
  if (!costs.length) return null;
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  const span = max - min || 1;
  const n = costs.length;
  const step = n > 1 ? width / (n - 1) : width;
  const path = costs.map((c, i) => {
    const x = i * step;
    const y = height - (((c - min) / span) * (height - 2) + 1);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  const lastX = (n - 1) * step;
  const lastY = height - (((costs[n - 1] - min) / span) * (height - 2) + 1);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx={lastX} cy={lastY} r="3" fill={stroke} />
    </svg>
  );
}

function DualSparkline({ purchases = [], sales = [], width = 380, height = 70 }) {
  const costVals = purchases.map(p => Number(p.unit_cost || 0));
  const sellVals = sales.map(s => Number(s.unit_price || 0));
  const all = [...costVals, ...sellVals].filter(v => typeof v === 'number' && !isNaN(v));
  if (!all.length) return null;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const n = Math.max(costVals.length, sellVals.length);
  const step = n > 1 ? width / (n - 1) : width;

  const toPath = (vals) => vals.map((v, i) => {
    const x = i * step;
    const y = height - (((v - min) / span) * (height - 4) + 2);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  const costPath = costVals.length ? toPath(costVals) : null;
  const sellPath = sellVals.length ? toPath(sellVals) : null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {costPath && <path d={costPath} fill="none" stroke="#4f46e5" strokeWidth="2" />}
      {sellPath && <path d={sellPath} fill="none" stroke="#059669" strokeWidth="2" />}
    </svg>
  );
}

export default function InventoryAverage({ filters = {}, products, options, histories = {} }) {
  const { data, setData, get, processing } = useForm({
    from: filters.from || '',
    to: filters.to || '',
    product_id: filters.product_id || '',
    vendor_id: filters.vendor_id || '',
  });

  // Async cache for per-product history
  const [cache, setCache] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const abortRef = useRef(null);

  const fetchHistory = async (pid) => {
    if (cache[pid]) return;
    try {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoadingId(pid);
      const params = new URLSearchParams({
        product_id: String(pid),
        from: data.from || '',
        to: data.to || '',
        vendor_id: data.vendor_id || '',
      });
      const res = await fetch(route('reports.inventoryAverage.history') + `?${params.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setCache(prev => ({ ...prev, [pid]: json }));
    } catch (e) {
      // noop
    } finally {
      setLoadingId(null);
    }
  };

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
                <th className="px-2 py-2 text-right">Change <Tooltip text="New Unit Cost minus Old Unit Cost. Green=up, Red=down.">i</Tooltip></th>
                <th className="px-2 py-2">Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-2 py-6 text-center text-gray-500">No data</td></tr>
              )}
              {rows.map((r) => {
                // Prefer async loaded history; fall back to server-provided lightweight history
                const loaded = cache[r.id];
                const purchasePts = loaded?.purchases?.points || histories[r.id]?.points || [];
                const salePts = loaded?.sales?.points || [];
                const latest = purchasePts.length ? purchasePts[0].unit_cost : null;
                const prevAvg = purchasePts.length > 1 ? (purchasePts.slice(1).reduce((a,b)=>a+Number(b.unit_cost||0),0) / (purchasePts.length-1)) : null;
                const pct = (latest != null && prevAvg && prevAvg !== 0) ? (((latest - prevAvg)/prevAvg)*100) : null;
                const margin = loaded?.metrics?.gross_margin ?? (null);
                const marginPct = loaded?.metrics?.gross_margin_pct ?? (null);
                return (
                <tr key={r.id} className="group relative border-t">
                  <td className="px-2 py-2" onMouseEnter={() => fetchHistory(r.id)}>
                    <div className="relative">
                      <div className="flex flex-col">
                        <span className="font-medium">{r.name}</span>
                        {r.sku && <span className="text-xs text-gray-500">SKU: {r.sku}</span>}
                      </div>
                      {(purchasePts.length > 0 || salePts.length > 0) && (
                        <div className="absolute left-0 top-full z-30 hidden w-[420px] translate-y-2 rounded-md border bg-white p-3 shadow-lg group-hover:block">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold">Cost vs Selling</div>
                            <div className="text-xs text-gray-500">Recent purchases & sales</div>
                          </div>
                          {loadingId === r.id ? (
                            <div className="flex h-[70px] w-full items-center justify-center text-xs text-gray-500">Loading…</div>
                          ) : (
                            <DualSparkline purchases={purchasePts} sales={salePts} width={380} height={70} />
                          )}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded bg-gray-50 p-2">
                              <div className="text-[11px] text-gray-500">Latest Unit Cost</div>
                              <div className="font-medium"><Currency value={latest} /></div>
                            </div>
                            <div className="rounded bg-gray-50 p-2">
                              <div className="text-[11px] text-gray-500">Prev Avg Cost</div>
                              <div className="font-medium"><Currency value={prevAvg ?? 0} /></div>
                            </div>
                            <div className="rounded bg-gray-50 p-2">
                              <div className="text-[11px] text-gray-500">Change vs Prev Avg</div>
                              <div className={`font-medium ${pct!=null && pct>0 ? 'text-green-600' : (pct!=null && pct<0 ? 'text-red-600' : '')}`}>{pct!=null ? `${pct.toFixed(2)}%` : '-'}</div>
                            </div>
                            <div className="rounded bg-gray-50 p-2">
                              <div className="text-[11px] text-gray-500">Gross Margin</div>
                              <div className="font-medium">{margin!=null ? <><Currency value={margin} /> · {marginPct!=null ? `${marginPct}%` : ''}</> : '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right">{r.stock}</td>
                  <td className="px-2 py-2 text-right">{r.old_qty}</td>
                  <td className="px-2 py-2 text-right"><Currency value={r.old_unit_cost} /></td>
                  <td className="px-2 py-2 text-right">{r.new_qty}</td>
                  <td className="px-2 py-2 text-right"><Currency value={r.new_unit_cost} /></td>
                  <td className="px-2 py-2 text-right"><Currency value={r.weighted_avg_unit_cost} /></td>
                  <td className={`px-2 py-2 text-right ${r.price_change > 0 ? 'text-green-600' : (r.price_change < 0 ? 'text-red-600' : '')}`}><Currency value={r.price_change} /></td>
                  <td className="px-2 py-2">{r.last_purchase_at || '-'}</td>
                </tr>
              );})}
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
