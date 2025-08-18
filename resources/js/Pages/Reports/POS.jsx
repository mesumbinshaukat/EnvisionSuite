import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function POS({ auth, filters, sales, summary }) {
  const { data, setData, get, processing } = useForm({
    from: filters.from,
    to: filters.to,
    payment_method: filters.payment_method || ''
  });

  const submit = (e) => { e.preventDefault(); get(route('reports.pos'), { preserveState: true }); };

  const byMethod = summary.by_method || [];
  const byCashier = summary.by_cashier || [];

  const methodChart = useMemo(() => ({
    labels: byMethod.map(m => m.payment_method || 'N/A'),
    datasets: [{
      label: 'Total',
      backgroundColor: '#2563eb',
      data: byMethod.map(m => Number(m.s || 0))
    }]
  }), [byMethod]);

  const cashierChart = useMemo(() => ({
    labels: byCashier.map(c => `User ${c.user_id}`),
    datasets: [{
      label: 'Total',
      backgroundColor: '#059669',
      data: byCashier.map(c => Number(c.s || 0))
    }]
  }), [byCashier]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="POS Reports" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">POS Reports</h1>
          <Link href={route('reports.pos.export', data)} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Export Excel</Link>
        </div>
        <form onSubmit={submit} className="bg-white shadow rounded p-4 grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm">From</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.from} onChange={e=>setData('from', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">To</label>
            <input type="date" className="mt-1 w-full border-gray-300 rounded" value={data.to} onChange={e=>setData('to', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Payment Method</label>
            <input className="mt-1 w-full border-gray-300 rounded" placeholder="cash/card/mobile..." value={data.payment_method} onChange={e=>setData('payment_method', e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={processing}>Apply</button>
          </div>
        </form>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 shadow rounded">
            <div className="mb-2 font-medium">Totals by Payment Method</div>
            <Bar data={methodChart} />
          </div>
          <div className="bg-white p-4 shadow rounded">
            <div className="mb-2 font-medium">Totals by Cashier</div>
            <Bar data={cashierChart} />
          </div>
        </div>

        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Cashier</th>
                <th className="px-4 py-2 text-left">Payment</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.data.map(s => (
                <tr key={s.id}>
                  <td className="px-4 py-2">{s.id}</td>
                  <td className="px-4 py-2">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{s.customer?.name || '-'}</td>
                  <td className="px-4 py-2">{s.user?.name || '-'}</td>
                  <td className="px-4 py-2">{s.payment_method || '-'}</td>
                  <td className="px-4 py-2 text-right">{Number(s.total || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500">Page {sales.current_page} of {sales.last_page}</div>
      </div>
    </AuthenticatedLayout>
  );
}
