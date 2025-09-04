import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import React, { useMemo } from 'react';

export default function Show({ sale }) {
  const fmt = (n) => Number(n ?? 0).toFixed(2);
  const balance = useMemo(() => Math.max(0, (parseFloat(sale.total || 0) - parseFloat(sale.amount_paid || 0))), [sale]);
  const status = sale.payment_status || (balance <= 0 ? 'paid' : (parseFloat(sale.amount_paid||0) > 0 ? 'partial' : 'credit'));
  const statusClass = status === 'paid' ? 'bg-green-100 text-green-700' : status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Sale #{sale.id}</h2>}>
      <Head title={`Sale #${sale.id}`} />
      <div className="mx-auto max-w-4xl p-6">
        <div className="space-y-4 rounded bg-white p-6 shadow">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-gray-600">Customer</div>
              <div className="font-medium">{sale.customer?.name || 'Walk-in'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Payment</div>
              <div className="mt-1 flex items-center gap-2 justify-end">
                <span className={`px-2 py-0.5 rounded text-xs ${statusClass}`}>{status}</span>
                <span className="text-sm text-gray-500">{sale.payment_method || '—'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Subtotal</div>
              <div className="font-semibold">{fmt(sale.subtotal)}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Discount</div>
              <div className="font-semibold">-{fmt(sale.discount)}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Tax</div>
              <div className="font-semibold">{fmt(sale.tax)}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Grand Total</div>
              <div className="font-bold">{fmt(sale.total)}</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left">Item</th>
                  <th className="px-2 py-2 text-right">Qty</th>
                  <th className="px-2 py-2 text-right">Unit (Sold)</th>
                  <th className="px-2 py-2 text-right">MSRP</th>
                  <th className="px-2 py-2 text-right">Tax</th>
                  <th className="px-2 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map(it => (
                  <tr key={it.id} className="border-t">
                    <td className="px-2 py-2">{it.product?.name}</td>
                    <td className="px-2 py-2 text-right">{it.quantity}</td>
                    <td className="px-2 py-2 text-right">
                      {fmt(it.sold_unit_price ?? it.unit_price)}
                      {it.is_discounted && <span className="ml-1 text-xs text-red-600">(disc)</span>}
                    </td>
                    <td className="px-2 py-2 text-right">{fmt(it.original_unit_price)}</td>
                    <td className="px-2 py-2 text-right">{it.tax_amount}</td>
                    <td className="px-2 py-2 text-right">{fmt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Amount Paid</div>
              <div className="font-semibold">{fmt(sale.amount_paid)}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Balance</div>
              <div className="font-semibold">{fmt(balance)}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs text-gray-500">Status</div>
              <div><span className={`mt-1 inline-block px-2 py-0.5 rounded text-xs ${statusClass}`}>{status}</span></div>
            </div>
          </div>

          <div className="mt-4 text-right">
            <Link href={route('sales.index')} className="text-blue-600">Back to Sales</Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
