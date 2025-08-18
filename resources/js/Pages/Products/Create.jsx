import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Tooltip from '@/Components/Tooltip';
import { formatPKR } from '@/lib/currency';

export default function Create({ purchasedProducts = [] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    if (!qq) return purchasedProducts;
    return purchasedProducts.filter(p => (p.name||'').toLowerCase().includes(qq) || (p.sku||'').toLowerCase().includes(qq));
  }, [q, purchasedProducts]);

  const { data, setData, post, processing } = useForm({
    product_id: '',
    cost_basis: 'average',
    fixed_cost: '',
    margin_type: 'percent',
    margin_value: '20',
    scope_type: 'all_units',
    scope_qty: '',
    discount_type: 'none',
    discount_value: '',
    starts_at: '',
    ends_at: '',
    notes: '',
  });

  const selected = useMemo(() => purchasedProducts.find(p => p.id === parseInt(data.product_id)) || null, [data.product_id, purchasedProducts]);
  const resolvedCost = useMemo(() => {
    if (!selected) return 0;
    if (data.cost_basis === 'fixed') return parseFloat(data.fixed_cost || 0);
    if (data.cost_basis === 'last') return parseFloat(selected.last_cost || 0);
    return parseFloat(selected.avg_cost || 0);
  }, [selected, data.cost_basis, data.fixed_cost]);
  const basePrice = useMemo(() => {
    const cost = parseFloat(resolvedCost || 0);
    const mv = parseFloat(data.margin_value || 0);
    if (data.margin_type === 'amount') return Math.max(0, cost + mv);
    return Math.max(0, cost * (1 + Math.max(0, mv)/100));
  }, [resolvedCost, data.margin_type, data.margin_value]);
  const soldPrice = useMemo(() => {
    const base = parseFloat(basePrice || 0);
    const dv = parseFloat(data.discount_value || 0);
    if (data.discount_type === 'amount') return Math.max(0, base - Math.max(0, dv));
    if (data.discount_type === 'percent') return Math.max(0, base * (1 - Math.max(0, Math.min(100, dv))/100));
    return base;
  }, [basePrice, data.discount_type, data.discount_value]);

  const scopeQty = useMemo(() => {
    const raw = parseInt(data.scope_qty || 0);
    if (!selected) return raw;
    const available = parseInt(selected.stock ?? 0);
    if (data.scope_type !== 'specific_qty') return 0;
    return Math.max(0, Math.min(available, isNaN(raw) ? 0 : raw));
  }, [data.scope_qty, data.scope_type, selected]);
  const totalPotential = useMemo(() => {
    if (data.scope_type !== 'specific_qty') return 0;
    return (parseFloat(soldPrice || 0) * parseInt(scopeQty || 0)) || 0;
  }, [soldPrice, scopeQty, data.scope_type]);

  const submit = (e) => { e.preventDefault(); post(route('pricing.store')); };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Set Product Pricing</h2>}>
      <Head title="Set Product Pricing" />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <div className="rounded bg-white p-4 shadow">
          <div className="mb-3 text-sm text-gray-600">
            Purpose: define selling price rules from purchase costs with margins and optional discounts. These rules prefill prices in POS and Sales. <Tooltip text="Pricing rules compute selling price from cost + margin and can include a discount. Scope limits how many units the rule applies to.">i</Tooltip>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium">Search Products <Tooltip text="Search by product name or SKU from purchased items.">i</Tooltip></label>
              <input value={q} onChange={e=>setQ(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="Search by name or SKU" />
            </div>
            <div className="w-80">
              <label className="block text-sm font-medium">Select Product <Tooltip text="Choose a product to base pricing on its purchase costs.">i</Tooltip></label>
              <select value={data.product_id} onChange={e=>setData('product_id', e.target.value)} className="mt-1 w-full rounded border p-2">
                <option value="">-- choose --</option>
                {filtered.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku}) · Stock: {p.stock ?? 0}</option>
                ))}
              </select>
            </div>
          </div>
          {selected && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded border p-3"><div className="text-xs text-gray-500">Avg Cost</div><div className="font-semibold">{formatPKR(Number(selected.avg_cost||0))}</div></div>
              <div className="rounded border p-3"><div className="text-xs text-gray-500">Last Cost</div><div className="font-semibold">{formatPKR(Number(selected.last_cost||0))}</div></div>
              <div className="rounded border p-3"><div className="text-xs text-gray-500">Current Price</div><div className="font-semibold">{formatPKR(Number(selected.price||0))}</div></div>
              <div className="rounded border p-3"><div className="text-xs text-gray-500">Resolved Cost</div><div className="font-semibold">{formatPKR(Number(resolvedCost||0))}</div></div>
              <div className="rounded border p-3 md:col-span-4"><div className="text-xs text-gray-500">Available Stock</div><div className="font-semibold">{Number(selected.stock||0)}</div></div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="rounded bg-white p-4 shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Cost Basis <Tooltip text="How to determine cost: weighted average, last purchase cost, or enter a fixed cost.">i</Tooltip></label>
              <select className="mt-1 w-full rounded border p-2" value={data.cost_basis} onChange={e=>setData('cost_basis', e.target.value)}>
                <option value="average">Weighted Average</option>
                <option value="last">Last Purchase</option>
                <option value="fixed">Fixed Cost</option>
              </select>
            </div>
            {data.cost_basis === 'fixed' && (
              <div>
                <label className="block text-sm font-medium">Fixed Cost <Tooltip text="Enter your own cost when neither average nor last cost applies.">i</Tooltip></label>
                <input type="number" step="0.0001" min={0} className="mt-1 w-full rounded border p-2" value={data.fixed_cost} onChange={e=>setData('fixed_cost', e.target.value)} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Margin <Tooltip text="Markup over cost. Choose percent or fixed amount.">i</Tooltip></label>
              <div className="mt-1 flex gap-2">
                <select className="rounded border p-2" value={data.margin_type} onChange={e=>setData('margin_type', e.target.value)}>
                  <option value="percent">Percent</option>
                  <option value="amount">Amount</option>
                </select>
                <input type="number" step="0.01" min={0} className="flex-1 rounded border p-2" value={data.margin_value} onChange={e=>setData('margin_value', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Scope <Tooltip text="Apply to all units or only a specific quantity (e.g., promo units).">i</Tooltip></label>
              <select className="mt-1 w-full rounded border p-2" value={data.scope_type} onChange={e=>setData('scope_type', e.target.value)}>
                <option value="all_units">All Units</option>
                <option value="specific_qty">Specific Quantity</option>
              </select>
            </div>
            {data.scope_type === 'specific_qty' && (
              <div>
                <label className="block text-sm font-medium">Scope Quantity <Tooltip text="Number of units this rule applies to. Cannot exceed available stock.">i</Tooltip></label>
                <input type="number" min={1} max={Math.max(1, Number(selected?.stock ?? 1))} className="mt-1 w-full rounded border p-2" value={data.scope_qty} onChange={e=>setData('scope_qty', e.target.value)} title={selected ? `Max ${selected.stock ?? 0}` : ''} />
                <div className="mt-1 text-xs text-gray-600">Clamped to available: {scopeQty}</div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Discount <Tooltip text="Optional reduction from the base price for promos.">i</Tooltip></label>
              <div className="mt-1 flex gap-2">
                <select className="rounded border p-2" value={data.discount_type} onChange={e=>setData('discount_type', e.target.value)}>
                  <option value="none">None</option>
                  <option value="percent">Percent</option>
                  <option value="amount">Amount</option>
                </select>
                <input type="number" step="0.01" min={0} className="flex-1 rounded border p-2" value={data.discount_value} onChange={e=>setData('discount_value', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded border p-3"><div className="text-xs text-gray-500">Base Price</div><div className="font-semibold">{formatPKR(Number(basePrice||0))}</div></div>
            <div className="rounded border p-3"><div className="text-xs text-gray-500">Sold Price</div><div className="font-semibold">{formatPKR(Number(soldPrice||0))}</div></div>
            {data.scope_type === 'specific_qty' && (
              <div className="rounded border p-3"><div className="text-xs text-gray-500">Total (Sold Price × Qty)</div><div className="font-semibold">{formatPKR(Number(totalPotential||0))}</div></div>
            )}
            <div>
              <label className="block text-sm font-medium">Starts At <Tooltip text="When this pricing rule becomes active.">i</Tooltip></label>
              <input type="datetime-local" className="mt-1 w-full rounded border p-2" value={data.starts_at} onChange={e=>setData('starts_at', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Ends At <Tooltip text="When this pricing rule expires (optional).">i</Tooltip></label>
              <input type="datetime-local" className="mt-1 w-full rounded border p-2" value={data.ends_at} onChange={e=>setData('ends_at', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Notes <Tooltip text="Internal notes about this rule (optional).">i</Tooltip></label>
            <textarea className="mt-1 w-full rounded border p-2" rows={3} value={data.notes} onChange={e=>setData('notes', e.target.value)} />
          </div>

          <div className="flex justify-between">
            <Link href={route('products.index')} className="rounded border px-4 py-2">Back</Link>
            <button disabled={processing || !data.product_id} className="rounded bg-blue-600 px-4 py-2 text-white">Save Pricing Rule</button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
