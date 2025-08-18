import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Tooltip from '@/Components/Tooltip';
import { formatPKR } from '@/lib/currency';

export default function POS({ customers, products }) {
  const { data, setData, post, processing, errors } = useForm({ customer_id:'', payment_method:'cash', items: [] });
  const addItem = (pid)=>{
    const prod = products.find(p=>p.id===parseInt(pid));
    if(!prod) return;
    setData('items', [...data.items, { product_id: prod.id, quantity: 1 }]);
  };
  const updateQty = (idx, qty)=>{
    const items = [...data.items];
    const it = items[idx];
    const prod = products.find(p=>p.id===it.product_id);
    const max = Math.max(0, parseInt(prod?.stock ?? 0));
    let val = parseInt(qty)||1;
    if (max > 0 && val > max) { val = max; }
    if (val < 1) val = 1;
    items[idx].quantity = val;
    setData('items', items);
  };
  const removeItem = (idx)=>{
    const items = [...data.items]; items.splice(idx,1); setData('items', items);
  };
  const submit = (e)=>{ e.preventDefault(); post(route('pos.checkout')); };

  // Totals
  const computeLine = (it) => {
    const p = products.find(pp=>pp.id===it.product_id);
    const price = Number(p?.price || 0);
    const qty = Number(it.quantity || 0);
    const taxRate = Number(p?.tax_rate || 0);
    const lineSubtotal = price * qty;
    const lineTax = lineSubtotal * Math.max(0, taxRate) / 100;
    const lineTotal = lineSubtotal + lineTax;
    return { price, qty, taxRate, lineSubtotal, lineTax, lineTotal };
  };
  const summary = data.items.reduce((acc, it) => {
    const r = computeLine(it);
    acc.subtotal += r.lineSubtotal;
    acc.tax += r.lineTax;
    acc.total += r.lineTotal;
    return acc;
  }, { subtotal: 0, tax: 0, total: 0 });
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Point of Sale</h2>}>
      <Head title="POS" />
      <div className="mx-auto max-w-5xl p-6">
        <form onSubmit={submit} className="space-y-4 bg-white p-6 shadow rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Customer</label>
              <select className="mt-1 w-full rounded border p-2" value={data.customer_id} onChange={e=>setData('customer_id', e.target.value)}>
                <option value="">Walk-in</option>
                {customers.map(c=> (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Payment</label>
              <select className="mt-1 w-full rounded border p-2" value={data.payment_method} onChange={e=>setData('payment_method', e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Add Product <Tooltip text="Add items to the cart. Quantity cannot exceed available stock.">i</Tooltip></label>
            <select className="mt-1 w-full rounded border p-2" onChange={e=>addItem(e.target.value)}>
              <option value="">Select product</option>
              {products.map(p=> (<option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.stock ?? 0}</option>))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left">Product</th>
                  <th className="px-2 py-2 text-right">Unit Price</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2 text-right">Line Subtotal</th>
                  <th className="px-2 py-2 text-right">Tax</th>
                  <th className="px-2 py-2 text-right">Line Total</th>
                  <th className="px-2 py-2 text-right">Available</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it, idx)=>{
                  const p = products.find(pp=>pp.id===it.product_i