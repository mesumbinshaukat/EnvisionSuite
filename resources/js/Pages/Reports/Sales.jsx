import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function Sales({ auth, filters, sales, total, pricingStats, paymentAggregates = [], discountsByCustomer = [], discountsByProduct = [] }) {
  const { get, data, setData } = useForm({ from: filters.from, to: filters.to });
  const submit = (e) => { e.preventDefault(); get(route('reports.sales'), { preserveState: true }); };

  const chartData = useMemo(() => {
    const points = (sales.data || []).reverse();
    const labels = points.map(s => new Date(s.created_at).toLocaleDateString());
    const totals = points.map(s => parseFloat(s.total));
    return { labels, datasets: [{ label: 'Sales Total', data: totals, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.2)' }] };
  }, [sales]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Sales Report" />
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-semibold">Sales Report</h1>
        <form onSubmit={submit} className="flex gap-2 items-end">
          <div>
            <label className="block text-sm text-gray-600">From</label>
            <input type="date" className="border rounded px-3 py-2" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600">To</label>
            <input type="date" className="border rounded px-3 py-2" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Apply</button>
          <Link className="px-4 py-2 bg-green-600 text-white rounded" href={route('reports.sales.export', { from: data.from, to: data.to })}>Export Excel</Link>
        </form>

        <div className="bg-white p-4 rounded shadow">
          <Line data={chartData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500">Average Sold Price</div>
            <div className="text-2xl font-semibold">{Number(pricingStats?.avg_sold_price ?? 0).toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500">Units @ Original Price</div>
            <div className="text-2xl font-semibold">{pricingStats?.units_original_price ?? 0}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-xs text-gray-500">Units @ Discounted Price</div>
            <div className="text-2xl font-semibold">{pricingStats?.units_discounted_price ?? 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentAggregates.map((p) => (
            <div key={p.status} className="bg-white p-4 rounded shadow">
              <div className="text-xs uppercase text-gray-500">{p.status}</div>
              <div className="mt-1 text-sm text-gray-600">Count: {p.cnt}</div>
              <div className="mt-1 text-sm text-gray-600">Paid: {Number(p.paid_sum).toFixed(2)}</div>
              <div className="mt-1 text-sm text-gray-600">Total: {Number(p.total_sum).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(sales.data || []).map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-2">{s.id}</td>
                  <td className="px-4 py-2">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{Number(s.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 text-right font-semibold">Total: {Number(total).toFixed(2)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="px-4 py-2 font-semibold">Top Discounts by Customer</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Line Discount</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Header Discount</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Total Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(discountsByCustomer || []).map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{row.customer_name || 'Walk-in'}</td>
                    <td className="px-4 py-2 text-right">{Number(row.line_discount).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{Number(row.header_discount).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{Number(row.total_discount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="px-4 py-2 font-semibold">Top Discounts by Product</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 uppercase">Line Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(discountsByProduct || []).map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{row.product_name}</td>
                    <td className="px-4 py-2 text-right">{Number(row.line_discount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
