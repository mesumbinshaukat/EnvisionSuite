import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatPKR } from '@/lib/currency';

export default function PricingIndex({ rules }) {
  const { delete: destroy, processing } = useForm();

  const onDelete = (ruleId) => {
    if (!confirm('Delete this pricing rule?')) return;
    router.delete(route('pricing.destroy', ruleId));
  };

  const rows = rules?.data || [];
  const links = rules?.links || [];

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Pricing Rules</h2>}>
      <Head title="Pricing Rules" />
      <div className="mx-auto max-w-7xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Manage price rules computed from product costs with margins and discounts.</div>
          <Link href={route('pricing.create')} className="rounded bg-blue-600 px-4 py-2 text-white">New Rule</Link>
        </div>

        <div className="overflow-x-auto rounded bg-white p-4 shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="p-2">Product</th>
                <th className="p-2">Cost Basis</th>
                <th className="p-2">Margin</th>
                <th className="p-2">Discount</th>
                <th className="p-2">Scope</th>
                <th className="p-2">Active Window</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={8}>No pricing rules found.</td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.product?.name} <span className="text-gray-500">({r.product?.sku})</span></td>
                  <td className="p-2 capitalize">{r.cost_basis}{r.cost_basis === 'fixed' && (
                    <span className="ml-1 text-gray-500">{formatPKR(Number(r.fixed_cost||0))}</span>
                  )}</td>
                  <td className="p-2">
                    {r.margin_type === 'percent' ? `${Number(r.margin_value||0)}%` : formatPKR(Number(r.margin_value||0))}
                  </td>
                  <td className="p-2">
                    {r.discount_type === 'none' ? '—' : (r.discount_type === 'percent' ? `${Number(r.discount_value||0)}%` : formatPKR(Number(r.discount_value||0)))}
                  </td>
                  <td className="p-2">
                    {r.scope_type === 'all_units' ? 'All units' : `First ${r.scope_qty || 0} units`}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div>{r.starts_at ? new Date(r.starts_at).toLocaleString() : '—'}</div>
                    <div>{r.ends_at ? new Date(r.ends_at).toLocaleString() : '—'}</div>
                  </td>
                  <td className="p-2">
                    {r.active ? <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-green-700">Active</span> : <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-gray-700">Inactive</span>}
                  </td>
                  <td className="p-2 text-right space-x-2">
                    <Link href={route('pricing.edit', r.id)} className="rounded border px-2 py-1">Edit</Link>
                    <button onClick={() => onDelete(r.id)} disabled={processing} className="rounded border border-red-600 px-2 py-1 text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((l, i) => (
                l.url ? (
                  <Link key={i} href={l.url} preserveScroll className={`rounded border px-2 py-1 ${l.active ? 'bg-blue-600 text-white' : ''}`} dangerouslySetInnerHTML={{ __html: l.label }} />
                ) : (
                  <span key={i} className="rounded border px-2 py-1 text-gray-400" dangerouslySetInnerHTML={{ __html: l.label }} />
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
