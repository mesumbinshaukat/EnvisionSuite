import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Currency from '@/Components/Currency';
import { useState } from 'react';

export default function Ledger({ customer, filters = {}, transactions = [], totals = {} }) {
  const [openRows, setOpenRows] = useState({});
  const { data, setData, get, processing } = useForm({
    from: filters.from || '',
    to: filters.to || '',
  });

  const isWalkIn = !customer?.id;
  const ledgerId = isWalkIn ? 0 : customer.id;

  const submit = (e) => {
    e.preventDefault();
    get(route('customers.ledger', ledgerId));
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Customer Ledger · {customer.name}</h2>}
    >
      <Head title={`Customer Ledger — ${customer.name}`} />
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            {isWalkIn ? (
              <Link href={route('walkin.index')} className="text-indigo-600 hover:underline">← Back to Walk-in Customers</Link>
            ) : (
              <Link href={route('customers.history')} className="text-indigo-600 hover:underline">← Back to Customer History</Link>
            )}
          </div>
        </div>

        <form onSubmit={submit} className="rounded bg-white p-4 shadow space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm text-gray-600">From</label>
              <input type="date" value={data.from} onChange={(e)=>setData('from', e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <input type="date" value={data.to} onChange={(e)=>setData('to', e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={processing} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Apply</button>
            <Link href={route('customers.ledger', ledgerId)} className="rounded border px-4 py-2">Reset</Link>
          </div>
        </form>

        <div className="rounded bg-white p-4 shadow overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="px-2 py-2 w-8"></th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Reference</th>
                <th className="px-2 py-2 text-right">Debit</th>
                <th className="px-2 py-2 text-right">Credit</th>
                <th className="px-2 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="px-2 py-6 text-center text-gray-500">No transactions</td></tr>
              )}
              {transactions.map((t, i) => (
                <>
                  <tr key={`row-${i}`} className="border-t">
                    <td className="px-2 py-2 align-top">
                      {t.type === 'sale' && (t.items || []).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setOpenRows(prev => ({ ...prev, [i]: !prev[i] }))}
                          className="rounded border px-2 text-xs"
                          aria-expanded={!!openRows[i]}
                        >
                          {openRows[i] ? '−' : '+'}
                        </button>
                      ) : null}
                    </td>
                    <td className="px-2 py-2">{t.date}</td>
                    <td className="px-2 py-2 capitalize">{t.type}</td>
                    <td className="px-2 py-2">{t.ref}</td>
                    <td className="px-2 py-2 text-right"><Currency value={t.debit} /></td>
                    <td className="px-2 py-2 text-right"><Currency value={t.credit} /></td>
                    <td className={`px-2 py-2 text-right ${t.balance>0 ? 'text-red-600' : 'text-green-600'}`}><Currency value={t.balance} /></td>
                  </tr>
                  {t.type === 'sale' && (t.items || []).length > 0 && openRows[i] && (
                    <tr key={`exp-${i}`} className="border-t bg-gray-50">
                      <td className="px-2 py-2"></td>
                      <td className="px-2 py-2" colSpan={6}>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left">
                                <th className="px-2 py-1">Product</th>
                                <th className="px-2 py-1 text-right">Qty</th>
                                <th className="px-2 py-1 text-right">Rate</th>
                                <th className="px-2 py-1 text-right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.items.map((it, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="px-2 py-1">{it.product}</td>
                                  <td className="px-2 py-1 text-right">{it.quantity}</td>
                                  <td className="px-2 py-1 text-right"><Currency value={it.price} /></td>
                                  <td className="px-2 py-1 text-right"><Currency value={it.total} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold">
                <td></td>
                <td className="px-2 py-2" colSpan={3}>Totals</td>
                <td className="px-2 py-2 text-right"><Currency value={totals.debit || 0} /></td>
                <td className="px-2 py-2 text-right"><Currency value={totals.credit || 0} /></td>
                <td className="px-2 py-2 text-right"><Currency value={totals.balance || 0} /></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
