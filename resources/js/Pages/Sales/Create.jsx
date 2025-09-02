import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Tooltip from '@/Components/Tooltip';
import React, { useMemo, useState } from 'react';
import { formatPKR } from '@/lib/currency';

export default function Create({ customers, products }) {
  const { data, setData, post, processing, errors } = useForm({
    customer_id: '',
    customer_name: '',
    customer_email: '',
    payment_method: 'cash',
    amount_paid: '',
    discount_type: 'amount',
    discount_value: '',
    note: '',
    items: [],
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    if (!q) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(q));
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const addItem = async (pid) => {
    const id = parseInt(pid);
    if (!id) return;
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    // Avoid duplicates: if exists, increment qty
    const idx = data.items.findIndex(i => i.product_id === id);
    if (idx >= 0) {
      const items = [...data.items];
      const current = parseInt(items[idx].quantity || 1);
      const max = Math.max(0, parseInt(prod?.stock ?? 0));
      items[idx].quantity = Math.min(max || current + 1, current + 1);
      setData('items', items);
    } else {
      let unit = prod.price;
      try {
        const res = await fetch(route('pricing.compute') + `?product_id=${id}`, { headers: { 'Accept': 'application/json' }});
        if (res.ok) {
          const j = await res.json();
          if (j && typeof j.sold_price !== 'undefined') {
            unit = parseFloat(j.sold_price);
          }
        }
      } catch (e) { /* ignore; fallback to product price */ }
      setData('items', [ ...data.items, { product_id: prod.id, quantity: 1, unit_price: unit } ]);
    }
  };

  const updateQty = (idx, qty) => {
    const qRaw = Math.max(1, parseInt(qty || 1));
    const items = [...data.items];
    const prod = products.find(p => p.id === items[idx].product_id);
    const max = Math.max(0, parseInt(prod?.stock ?? 0));
    items[idx].quantity = max > 0 ? Math.min(max, qRaw) : qRaw;
    setData('items', items);
  };

  const updatePrice = (idx, price) => {
    const p = Math.max(0, parseFloat(price || 0));
    const items = [...data.items];
    items[idx].unit_price = p;
    setData('items', items);
  };

  const removeItem = (idx) => {
    const items = [...data.items]; items.splice(idx, 1); setData('items', items);
  };

  const totals = useMemo(() => {
    const subtotal = data.items.reduce((s, it) => {
      const prod = products.find(p => p.id === it.product_id);
      const up = parseFloat(it.unit_price ?? (prod?.price ?? 0));
      const q = parseInt(it.quantity ?? 0);
      const lt = it.line_total != null ? Number(it.line_total || 0) : (up * q);
      return s + lt;
    }, 0);
    const discountValue = parseFloat(data.discount_value || 0);
    let headerDiscount = 0;
    if (data.discount_type === 'percent') {
      headerDiscount = Math.min(100, Math.max(0, discountValue)) * subtotal / 100.0;
    } else {
      headerDiscount = Math.min(subtotal, Math.max(0, discountValue));
    }
    const taxableBase = Math.max(0, subtotal - headerDiscount);
    // Tax: sum per line based on product tax_rate, scaled by discount proportion
    let tax = 0;
    let subNoDiscount = subtotal || 1; // avoid div by zero
    const scale = taxableBase / subNoDiscount;
    data.items.forEach(it => {
      const prod = products.find(p => p.id === it.product_id);
      const up = parseFloat(it.unit_price ?? (prod?.price ?? 0));
      const q = parseInt(it.quantity ?? 0);
      const lineSubAfter = up * q * scale;
      const rate = parseFloat(prod?.tax_rate ?? 0) / 100.0;
      tax += lineSubAfter * rate;
    });
    tax = Math.round(tax * 100) / 100;
    const grand = Math.round((taxableBase + tax) * 100) / 100;
    const hasAmount = data.amount_paid !== '' && !isNaN(parseFloat(data.amount_paid));
    const paid = hasAmount ? Math.min(grand, Math.max(0, parseFloat(data.amount_paid))) : 0;
    const balance = Math.max(0, Math.round((grand - paid) * 100) / 100);
    const status = hasAmount ? (balance <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'credit')) : 'credit';
    return { subtotal, headerDiscount, tax, grand, paid, balance, status };
  }, [data.items, data.discount_type, data.discount_value, data.amount_paid, products]);

  const submit = (e) => { e.preventDefault(); post(route('sales.store')); };
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">New Sale</h2>}>
      <Head title="New Sale" />
      <div className="mx-auto max-w-4xl p-6">
        <form onSubmit={submit} className="space-y-6 bg-white p-6 shadow rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Customer</label>
              <input className="mt-1 w-full rounded border p-2" placeholder="Search customer" value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} />
              <select className="mt-2 w-full rounded border p-2" value={data.customer_id} onChange={e=>setData('customer_id', e.target.value)}>
                <option value="">Walk-in</option>
                {filteredCustomers.map(c=> (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <div className="text-xs text-gray-600">Or create a new customer (name and unique email):</div>
                <input className="w-full rounded border p-2" placeholder="New customer name" value={data.customer_name} onChange={e=>setData('customer_name', e.target.value)} />
                <input type="email" className="w-full rounded border p-2" placeholder="New customer email" value={data.customer_email} onChange={e=>setData('customer_email', e.target.value)} />
                <div className="text-xs text-gray-500">If you leave the dropdown empty and provide these fields, we will auto-create and link this customer on save.</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Payment Method</label>
              <select className="mt-1 w-full rounded border p-2" value={data.payment_method} onChange={e=>setData('payment_method', e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="mobile">Mobile</option>
                <option value="wallet">Wallet</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Amount Paid</label>
              <input type="number" min={0} step="0.01" className="mt-1 w-full rounded border p-2" value={data.amount_paid} onChange={e=>setData('amount_paid', e.target.value)} />
              <div className="mt-1 text-xs text-gray-500">Status: <span className={`px-2 py-0.5 rounded ${totals.status==='paid'?'bg-green-100 text-green-700':totals.status==='partial'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{totals.status}</span></div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium">Note / Label (optional)</label>
              <input type="text" maxLength={255} className="mt-1 w-full rounded border p-2" placeholder="e.g., John Doe (Walk-in), Table 7, Urgent delivery, etc." value={data.note} onChange={e=>setData('note', e.target.value)} />
              <div className="mt-1 text-xs text-gray-500">This note will appear on Walk-in analytics and the ledger.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Add Products <Tooltip text="Search and add items. Quantity cannot exceed available stock.">i</Tooltip></label>
              <input className="mt-1 w-full rounded border p-2" placeholder="Search by name or SKU" value={productSearch} onChange={e=>setProductSearch(e.target.value)} />
              <div className="mt-2 max-h-40 overflow-y-auto border rounded">
                {filteredProducts.slice(0, 100).map(p => (
                  <button type="button" key={p.id} onClick={()=>addItem(p.id)} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex justify-between">
                    <span>{p.name} ({p.sku})</span>
                    <span className="text-sm text-gray-600">{formatPKR(Number(p.price))} · Stock: {p.stock ?? 0}</span>
                  </button>
                ))}
                {filteredProducts.length===0 && <div className="p-3 text-sm text-gray-500">No products</div>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Discount</label>
              <div className="mt-1 flex gap-2">
                <select className="rounded border p-2" value={data.discount_type} onChange={e=>setData('discount_type', e.target.value)}>
                  <option value="amount">Amount</option>
                  <option value="percent">Percent</option>
                </select>
                <input type="number" min={0} step="0.01" className="flex-1 rounded border p-2" value={data.discount_value} onChange={e=>setData('discount_value', e.target.value)} />
              </div>
              <div className="mt-2 text-xs text-gray-600">Calculated: {totals.headerDiscount.toFixed(2)}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left">Product</th>
                  <th className="px-2 py-2 text-right">Unit Price <Tooltip text="Prefilled from pricing rules; can be overridden.">i</Tooltip></th>
                  <th className="px-2 py-2 text-right">Qty</th>
                  <th className="px-2 py-2 text-right">Available</th>
                  <th className="px-2 py-2 text-right">Line Subtotal</th>
                  <th className="px-2 py-2 text-right">Line Total <Tooltip text="You can edit this; Unit Price will be recalculated as Line Total / Qty.">i</Tooltip></th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it, idx) => {
                  const p = products.find(pp => pp.id === it.product_id);
                  const up = parseFloat(it.unit_price ?? p?.price ?? 0);
                  const q = parseInt(it.quantity ?? 0);
                  const lineTotal = it.line_total != null ? Number(it.line_total||0) : (up * q);
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-2">{p?.name}</td>
                      <td className="px-2 py-2 text-right">
                        <input type="number" min={0} step="0.01" className="w-28 rounded border p-2 text-right" value={it.unit_price ?? ''} onChange={e=>updatePrice(idx, e.target.value)} />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input type="number" min={1} max={Math.max(1, p?.stock ?? 1)} className="w-24 rounded border p-2 text-right" value={it.quantity} onChange={e=>updateQty(idx, e.target.value)} title={`Max ${p?.stock ?? 0} available`} />
                      </td>
                      <td className="px-2 py-2 text-right">{p?.stock ?? 0}</td>
                      <td className="px-2 py-2 text-right">{formatPKR(up * q)}</td>
                      <td className="px-2 py-2 text-right">
                        <input type="number" min={0} step="0.01" className="w-32 rounded border p-2 text-right" value={Number(lineTotal||0)} onChange={e=>{
                          const v = Number(e.target.value||0);
                          const copy = [...data.items];
                          const qty = Number(copy[idx].quantity||0) || 1;
                          const newUnit = Number((v / qty).toFixed(2));
                          copy[idx] = { ...copy[idx], line_total: v, unit_price: newUnit };
                          setData('items', copy);
                        }} />
                      </td>
                      <td className="px-2 py-2 text-right"><button type="button" onClick={()=>removeItem(idx)} className="text-red-600">Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {errors.items && <div className="text-sm text-red-600">{errors.items}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div></div>
            <div className="bg-gray-50 rounded p-4">
              <div className="flex justify-between py-1"><span className="text-sm text-gray-600">Subtotal</span><span className="font-medium">{formatPKR(totals.subtotal)}</span></div>
              <div className="flex justify-between py-1"><span className="text-sm text-gray-600">Discount</span><span className="font-medium">-{formatPKR(totals.headerDiscount)}</span></div>
              <div className="flex justify-between py-1"><span className="text-sm text-gray-600">Tax</span><span className="font-medium">{formatPKR(totals.tax)}</span></div>
              <div className="flex justify-between py-2 border-t mt-2"><span className="font-medium">Grand Total</span><span className="font-bold">{formatPKR(totals.grand)}</span></div>
              <div className="flex justify-between py-1"><span className="text-sm text-gray-600">Paid</span><span className="font-medium">{formatPKR(totals.paid)}</span></div>
              <div className="flex justify-between py-1"><span className="text-sm text-gray-600">Balance</span><span className="font-medium">{formatPKR(totals.balance)}</span></div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Link href={route('sales.index')} className="rounded border px-4 py-2">Cancel</Link>
            <button disabled={processing} className="rounded bg-blue-600 px-4 py-2 text-white">Checkout</button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
