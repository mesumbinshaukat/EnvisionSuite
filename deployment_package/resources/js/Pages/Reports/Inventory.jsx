import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Inventory({ auth, products, movements }) {
  const chartData = useMemo(() => {
    const rows = products.data || [];
    const labels = rows.map(p => p.name);
    const stock = rows.map(p => p.stock ?? 0);
    return { labels, datasets: [{ label: 'Stock', data: stock, backgroundColor: 'rgba(16,185,129,0.5)' }] };
  }, [products]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Inventory Report" />
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-semibold">Inventory Report</h1>

        <div className="bg-white p-4 rounded shadow">
          <Bar data={chartData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="p-4 font-semibold">Products</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">In Shop</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Lent Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(products.data || []).map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.sku}</td>
                    <td className="px-4 py-2">{p.stock}</td>
                    <td className="px-4 py-2">{p.in_shop ?? Math.max(0, (p.stock ?? 0) - (p.lent_out ?? 0))}</td>
                    <td className="px-4 py-2">{p.lent_out ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded shadow overflow-x-auto">
            <div className="p-4 font-semibold">Recent Movements</div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(movements || []).map(m => (
                  <tr key={m.id}>
                    <td className="px-4 py-2">{m.product?.name ?? m.product_id}</td>
                    <td className="px-4 py-2">{m.type}</td>
                    <td className="px-4 py-2">{m.quantity_change}</td>
                    <td className="px-4 py-2">{new Date(m.created_at).toLocaleString()}</td>
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
