import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Tooltip from '@/Components/Tooltip';
import Currency from '@/Components/Currency';

export default function Create({ vendors = [], products = [] }) {
  const { props } = usePage();
  const vendorCreated = props.flash?.vendorCreated;

  const [vendorQuery, setVendorQuery] = useState('');
  const filteredVendors = useMemo(() => {
    const q = vendorQuery.toLowerCase();
    return vendors.filter(v => (v.name?.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q)));
  }, [vendorQuery, vendors]);

  const [productQuery, setProductQuery] = useState('');
  const filteredProducts = useMemo(() => {
    const q = productQuery.toLowerCase();
    return products.filter(p => (p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)));
  }, [productQuery, products]);

  const { data, setData, post, processing, errors, reset } = useForm({
    vendor_id: '', vendor_name: '', vendor_email: '', vendor_phone: '',
    items: [], tax_percent: 0, other_charges: 0, notes: '', payment_method: '', amount_paid: 0,
  });

  const [selectedProductIds, setSelectedProductIds] = useState([]);
  useEffect(() => {
    const lines = selectedProductIds.map(id => {
      const p = products.find(x => x.id === id);
      const existing = data.items.find(li => li.product_id === id);
      return existing || { product_id: id, quantity: 1, unit_cost: p?.price ?? 0 };
    });
    setData('items', lines);
  }, [selectedProductIds]);

  const subtotal = (data.items || []).reduce((s, li) => {
    const qty = Number(li.quantity || 0);
    const unit = Number(li.unit_cost || 0);
    const lt = li.line_total != null ? Number(li.line_total || 0) : (qty * unit);
    return s + lt;
  }, 0);
  const tax = Number(((subtotal) * (Number(data.tax_percent || 0)/100)).toFixed(2));
  const grand = Number((subtotal + tax + Number(data.other_charges || 0)).toFixed(2));
  const remaining = Math.max(0, Number((grand - Number(data.amount_paid || 0)).toFixed(2)));

  const submit = (e) => {
    e.preventDefault();
    post(route('purchases.store'));
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">New Purchase</h2>}>
      <Head title="New Purchase" />
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <form onSubmit={submit} className="space-y-6">
          <div className="rounded bg-white p-4 shadow space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">Vendor <Tooltip text="Select an existing vendor or enter details to auto-create.">i</Tooltip></h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input value={vendorQuery} onChange={e=>setVendorQuery(e.target.value)} placeholder="Search vendor by name or email" className="w-full rounded border px-3 py-2" />
                <Tooltip text="Type to search vendors; select below.">i</Tooltip>
              </div>
              <select value={data.vendor_id} onChange={e=>setData('vendor_id', e.target.value ? Number(e.target.value) : '')} className="w-full rounded border px-3 py-2">
                <option value="">Select existing vendor</option>
                {filteredVendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} {v.email ? `(${v.email})` : ''}</option>
                ))}
              </select>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input value={data.vendor_name} onChange={e=>setData('vendor_name', e.target.value)} placeholder="New vendor name (auto-create if not found)" className="rounded border px-3 py-2" />
                <input value={data.vendor_email} onChange={e=>setData('vendor_email', e.target.value)} placeholder="Email" className="rounded border px-3 py-2" />
                <input value={data.vendor_phone} onChange={e=>setData('vendor_phone', e.target.value)} placeholder="Phone" className="rounded border px-3 py-2" />
              </div>
              {errors.vendor_id && <div className="text-sm text-red-600">{errors.vendor_id}</div>}
            </div>
          </div>

          <div className="rounded bg-white p-4 shadow space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">Products <Tooltip text="Pick products to add purchase lines.">i</Tooltip></h3>
            <div className="flex items-center gap-2">
              <input value={productQuery} onChange={e=>setProductQuery(e.target.value)} placeholder="Search products by name or SKU" className="w-full rounded border px-3 py-2" />
              <Tooltip text="Search by name or SKU, then tick items below.">i</Tooltip>
            </div>
            <div className="rounded border">
              <div className="max-h-48 overflow-y-auto">
                {filteredProducts.map(p => {
                  const checked = selectedProductIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-3 border-b px-3 py-2">
                      <input type="checkbox" checked={checked} onChange={() => {
                        setSelectedProductIds(prev => checked ? prev.filter(x=>x!==p.id) : [...prev, p.id]);
                      }} />
                      <span className="flex-1">{p.name} {p.sku ? `(${p.sku})` : ''}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {data.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left">Product <Tooltip text="The item being purchased.">i</Tooltip></th>
                      <th className="px-2 py-2 text-right">Qty <Tooltip text="Number of units for this line.">i</Tooltip></th>
                      <th className="px-2 py-2 text-right">Unit Cost <Tooltip text="Cost per unit. Editing this updates Line Total.">i</Tooltip></th>
                      <th className="px-2 py-2 text-right">Line Total <Tooltip text="Total cost for this line. You can edit this and we will compute Unit Cost = Line Total / Qty.">i</Tooltip></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((li, idx) => {
                      const p = products.find(x=>x.id===li.product_id);
                      const qty = Number(li.quantity||0);
                      const unit = Number(li.unit_cost||0);
                      const lineTotal = li.line_total != null ? Number(li.line_total||0) : (qty * unit);
                      return (
                        <tr key={li.product_id} className="border-t">
                          <td className="px-2 py-2">{p?.name}</td>
                          <td className="px-2 py-2 text-right">
                            <input type="number" min={1} value={li.quantity} onChange={e=>{
                              const v = Number(e.target.value||0);
                              const copy = [...data.items];
                              const currentLineTotal = copy[idx].line_total != null ? Number(copy[idx].line_total||0) : (Number(copy[idx].quantity||0) * Number(copy[idx].unit_cost||0));
                              // When quantity changes, keep unit cost and recompute line_total accordingly
                              const newUnit = Number(copy[idx].unit_cost || 0);
                              const newLineTotal = Number((v * newUnit).toFixed(2));
                              copy[idx] = {...copy[idx], quantity: v, line_total: newLineTotal};
                              setData('items', copy);
                            }} className="w-24 rounded border px-2 py-1 text-right" />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <input type="number" min={0} step="0.01" value={li.unit_cost} onChange={e=>{
                              const v = Number(e.target.value||0);
                              const copy = [...data.items];
                              const qty = Number(copy[idx].quantity||0);
                              const newLineTotal = Number((qty * v).toFixed(2));
                              copy[idx] = {...copy[idx], unit_cost: v, line_total: newLineTotal};
                              setData('items', copy);
                            }} className="w-28 rounded border px-2 py-1 text-right" />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <input type="number" min={0} step="0.01" value={Number(lineTotal||0)} onChange={e=>{
                              const v = Number(e.target.value||0);
                              const copy = [...data.items];
                              const qty = Number(copy[idx].quantity||0) || 1; // avoid divide by zero
                              const newUnit = Number((v / qty).toFixed(2));
                              copy[idx] = {...copy[idx], line_total: v, unit_cost: newUnit};
                              setData('items', copy);
                            }} className="w-32 rounded border px-2 py-1 text-right" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded bg-white p-4 shadow space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">Totals & Payment <Tooltip text="Taxes and charges adjust the grand total; remaining = grand - amount paid.">i</Tooltip></h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">Tax Percent <Tooltip text="Percentage applied to subtotal.">i</Tooltip></label>
                <input type="number" min={0} step="0.01" value={data.tax_percent} onChange={e=>setData('tax_percent', Number(e.target.value||0))} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">Other Charges <Tooltip text="Shipping or additional fees.">i</Tooltip></label>
                <input type="number" min={0} step="0.01" value={data.other_charges} onChange={e=>setData('other_charges', Number(e.target.value||0))} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">Amount Paid Now <Tooltip text="Payment at time of purchase.">i</Tooltip></label>
                <input type="number" min={0} step="0.01" value={data.amount_paid} onChange={e=>setData('amount_paid', Number(e.target.value||0))} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">Payment Method <Tooltip text="How this purchase was paid.">i</Tooltip></label>
                <select value={data.payment_method} onChange={e=>setData('payment_method', e.target.value)} className="w-full rounded border px-3 py-2">
                  <option value="">Select</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank</option>
                  <option value="credit">On Credit</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">Notes <Tooltip text="Optional notes for this purchase.">i</Tooltip></label>
                <input value={data.notes} onChange={e=>setData('notes', e.target.value)} className="w-full rounded border px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded border p-3"><div className="text-sm text-gray-600 flex items-center gap-1">Subtotal <Tooltip text="Sum of line totals.">i</Tooltip></div><div className="text-xl font-semibold"><Currency value={subtotal} /></div></div>
              <div className="rounded border p-3"><div className="text-sm text-gray-600 flex items-center gap-1">Tax <Tooltip text="Calculated from tax percent.">i</Tooltip></div><div className="text-xl font-semibold"><Currency value={tax} /></div></div>
              <div className="rounded border p-3"><div className="text-sm text-gray-600 flex items-center gap-1">Other Charges <Tooltip text="Additional fees added to total.">i</Tooltip></div><div className="text-xl font-semibold"><Currency value={Number(data.other_charges||0)} /></div></div>
              <div className="rounded border p-3"><div className="text-sm text-gray-600 flex items-center gap-1">Grand Total <Tooltip text="Subtotal + Tax + Other Charges.">i</Tooltip></div><div className="text-xl font-semibold"><Currency value={grand} /></div></div>
              <div className="rounded border p-3"><div className="text-sm text-gray-600 flex items-center gap-1">Remaining <Tooltip text="Grand Total minus Amount Paid.">i</Tooltip></div><div className="text-xl font-semibold"><Currency value={remaining} /></div></div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href={route('purchases.index')} className="rounded border px-4 py-2">Cancel</Link>
            <button disabled={processing} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Save Purchase</button>
          </div>
        </form>

        {/* Vendor created modal */}
        {vendorCreated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded bg-white p-6 shadow">
              <h3 className="mb-2 text-lg font-semibold">Vendor Created</h3>
              <p className="mb-4 text-sm text-gray-700">A new vendor was created: {vendorCreated.name}. You can update details now.</p>
              <div className="flex justify-end gap-2">
                <Link href={route().has('vendors.edit') ? route('vendors.edit', vendorCreated.id) : '#'} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Edit Vendor</Link>
                <Link href={route('purchases.index')} className="rounded border px-4 py-2">Close</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
