import React, { useMemo, useState } from 'react';
import { formatPKR } from '@/lib/currency';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function PricingCreate({ purchasedProducts = [] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    if (!qq) return purchasedProducts;
    return purchasedProducts.filter(p => (p.name||'').toLowerCase().includes(qq) || (p.sku||'').toLowerCase().includes(qq));
  }, [q, purchasedProducts]);

  const { data, setData, post, processing } = useForm({
    product_id: '',
    cost_basis: 'fixed',
    fixed_cost: '',
    margin_type: 'percent',
    margin_value: '20',
    scope_type: 'all_units',
    scope_qty: '',
    discount_type: 'none',
    discount_value: '0',
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
  const computedPrice = useMemo(() => {
    if (data.margin_type === 'percent') {
      return resolvedCost * (1 + parseFloat(data.margin_value || 0) / 100);
    }
    return resolvedCost + parseFloat(data.margin_value || 0);
  }, [resolvedCost, data.margin_type, data.margin_value]);
  const finalPrice = useMemo(() => {
    if (data.discount_type === 'percent') {
      return computedPrice * (1 - parseFloat(data.discount_value || 0) / 100);
    }
    if (data.discount_type === 'amount') {
      return Math.max(0, computedPrice - parseFloat(data.discount_value || 0));
    }
    return computedPrice;
  }, [computedPrice, data.discount_type, data.discount_value]);

  const submit = (e) => { 
    e.preventDefault(); 
    
    // Ensure discount_value is properly set before submission
    if (data.discount_type === 'none') {
      setData('discount_value', '0');
    }
    
    post(route('pricing.store')); 
  };

  // Handle discount type change to reset discount value when switching to 'none'
  const handleDiscountTypeChange = (e) => {
    const newType = e.target.value;
    setData('discount_type', newType);
    if (newType === 'none') {
      setData('discount_value', '0');
    }
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Create Pricing Rule</h2>}>
      <Head title="Create Pricing Rule" />
      <div className="mx-auto max-w-4xl p-6">
        <form onSubmit={submit} className="space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {filtered.map(p => (
                  <div
                    key={p.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                      data.product_id === p.id.toString() ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      setData('product_id', p.id.toString());
                      setQ(p.name);
                    }}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-500">SKU: {p.sku} | Stock: {p.stock} | Price: ${p.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cost Basis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Basis</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.cost_basis}
              onChange={(e) => setData('cost_basis', e.target.value)}
            >
              <option value="last">Last Purchase</option>
              <option value="average">Weighted Average</option>
              <option value="fixed">Fixed Cost/Buy Price</option>
            </select>
          </div>

          {/* Fixed Cost (only show when cost_basis is fixed) */}
          {data.cost_basis === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Cost/Buy Price</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.fixed_cost}
                onChange={(e) => setData('fixed_cost', e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Selling Price (Margin) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price</label>
            <div className="flex space-x-2">
              <select
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.margin_type}
                onChange={(e) => setData('margin_type', e.target.value)}
              >
                <option value="percent">Percentage (%)</option>
                <option value="amount">Fixed Amount ($)</option>
              </select>
              <input
                type="number"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.margin_value}
                onChange={(e) => setData('margin_value', e.target.value)}
                placeholder={data.margin_type === 'percent' ? '20' : '5.00'}
              />
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.scope_type}
              onChange={(e) => setData('scope_type', e.target.value)}
            >
              <option value="all_units">All Units</option>
              <option value="specific_qty">Specific Quantity</option>
            </select>
          </div>

          {/* Scope Quantity (only show when scope_type is specific_qty) */}
          {data.scope_type === 'specific_qty' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scope Quantity</label>
              <input
                type="number"
                min="1"
                max={selected?.stock || 999999}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.scope_qty}
                onChange={(e) => setData('scope_qty', e.target.value)}
                placeholder="1"
              />
              {selected && (
                <p className="mt-1 text-sm text-gray-500">Available stock: {selected.stock} units</p>
              )}
            </div>
          )}

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
            <div className="flex space-x-2">
              <select
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.discount_type}
                onChange={handleDiscountTypeChange}
              >
                <option value="none">None</option>
                <option value="percent">Percentage (%)</option>
                <option value="amount">Fixed Amount ($)</option>
              </select>
              {data.discount_type !== 'none' && (
                <input
                  type="number"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.discount_value}
                  onChange={(e) => setData('discount_value', e.target.value)}
                  placeholder={data.discount_type === 'percent' ? '10' : '2.00'}
                />
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (Optional)</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.starts_at}
                onChange={(e) => setData('starts_at', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data.ends_at}
                onChange={(e) => setData('ends_at', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={data.notes}
              onChange={(e) => setData('notes', e.target.value)}
              placeholder="Additional notes about this pricing rule..."
            />
          </div>

          {/* Preview */}
          {selected && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Price Preview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cost Basis:</span>
                  <span className="ml-2 font-medium">${resolvedCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Selling Price:</span>
                  <span className="ml-2 font-medium">${computedPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Final Price:</span>
                  <span className="ml-2 font-medium text-green-600">${finalPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Profit Margin:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    ${(finalPrice - resolvedCost).toFixed(2)} ({(finalPrice - resolvedCost) / resolvedCost * 100}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href={route('pricing.index')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={processing || !data.product_id}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Creating...' : 'Create Pricing Rule'}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
