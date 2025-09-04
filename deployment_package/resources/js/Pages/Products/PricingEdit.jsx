import React, { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Tooltip from '@/Components/Tooltip';
import { formatPKR } from '@/lib/currency';

export default function PricingEdit({ rule }) {
  const { data, setData, put, processing } = useForm({
    cost_basis: rule.cost_basis || 'average',
    fixed_cost: rule.fixed_cost ?? '',
    margin_type: rule.margin_type || 'percent',
    margin_value: String(rule.margin_value ?? ''),
    scope_type: rule.scope_type || 'all_units',
    scope_qty: rule.scope_qty ?? '',
    discount_type: rule.discount_type || 'none',
    discount_value: String(rule.discount_value ?? ''),
    starts_at: rule.starts_at ? rule.starts_at.substring(0,16) : '',
    ends_at: rule.ends_at ? rule.ends_at.substring(0,16) : '',
    notes: rule.notes ?? '',
    active: !!rule.active,
  });

  const submit = (e)=>{ e.preventDefault(); put(route('pricing.update', rule.id)); };

  // Display preview price similar to create page (requires cost context; show margin/discount formatting only)
  const marginDisplay = useMemo(()=> data.margin_type === 'percent' ? `${Number(data.margin_value||0)}%` : formatPKR(Number(data.margin_value||0)), [data.margin_type, data.margin_value]);
  const discountDisplay = useMemo(()=> data.discount_type === 'percent' ? `${Number(data.discount_value||0)}%` : (data.discount_type === 'amount' ? formatPKR(Number(data.discount_value||0)) : 'None'), [data.discount_type, data.discount_value]);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Edit Pricing Rule</h2>}>
      <Head title={`Edit Pricing Rule #${rule.id}`} />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <div className="rounded bg-white p-4 shadow">
          <div className="mb-2 text-sm text-gray-600">Editing rule for <span className="font-medium">{rule.product?.name}</span> <span className="text-gray-500">({rule.product?.sku})</span></div>
          <div className="text-xs text-gray-500">Current settings summary: Margin {marginDisplay}, Discount {discountDisplay}, Scope {data.scope_type === 'all_units' ? 'All units' : `${data.scope_qty||0} units`}.</div>
        </div>

        <form onSubmit={submit} className="rounded bg-white p-4 shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Cost Basis <Tooltip text="Use last, average or a fixed cost value.">i</Tooltip></label>
              <select className="mt-1 w-full rounded border p-2" value={data.cost_basis} onChange={e=>setData('cost_basis', e.target.value)}>
                <option value="average">Weighted Average</option>
                <option value="last">Last Purchase</option>
                <option value="fixed">Fixed Cost</option>
              </select>
            </div>
            {data.cost_basis === 'fixed' && (
              <div>
                <label className="block text-sm font-medium">Fixed Cost</label>
                <input type="number" step="0.0001" min={0} className="mt-1 w-full rounded border p-2" value={data.fixed_cost} onChange={e=>setData('fixed_cost', e.target.value)} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Margin</label>
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
              <label className="block text-sm font-medium">Scope</label>
              <select className="mt-1 w-full rounded border p-2" value={data.scope_type} onChange={e=>setData('scope_type', e.target.value)}>
                <option value="all_units">All Units</option>
                <option value="specific_qty">Specific Quantity</option>
              </select>
            </div>
            {data.scope_type === 'specific_qty' && (
              <div>
                <label className="block text-sm font-medium">Scope Quantity</label>
                <input type="number" min={1} className="mt-1 w-full rounded border p-2" value={data.scope_qty} onChange={e=>setData('scope_qty', e.target.value)} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Discount</label>
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
            <div>
              <label className="block text-sm font-medium">Starts At</label>
              <input type="datetime-local" className="mt-1 w-full rounded border p-2" value={data.starts_at} onChange={e=>setData('starts_at', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Ends At</label>
              <input type="datetime-local" className="mt-1 w-full rounded border p-2" value={data.ends_at} onChange={e=>setData('ends_at', e.target.value)} />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={data.active} onChange={e=>setData('active', e.target.checked)} /> Active</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea className="mt-1 w-full rounded border p-2" rows={3} value={data.notes} onChange={e=>setData('notes', e.target.value)} />
          </div>

          <div className="flex justify-between">
            <Link href={route('pricing.index')} className="rounded border px-4 py-2">Back</Link>
            <button disabled={processing} className="rounded bg-blue-600 px-4 py-2 text-white">Save Changes</button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
