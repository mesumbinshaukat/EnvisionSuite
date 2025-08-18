import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);
import { formatPKR } from '@/lib/currency';

export default function CustomerAging({ auth, rows, buckets }) {
  const chartData = useMemo(() => ({
    labels: ['0-30','31-60','61-90','90+'],
    datasets: [{
      data: [buckets['0-30']||0, buckets['31-60']||0, buckets['61-90']||0, buckets['90+']||0],
      backgroundColor: ['#22c55e','#eab308','#f97316','#ef4444'],
    }]
  }), [buckets]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Customer Aging" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Customer Aging</h1>
          <Link href={route('reports.accounting.customerAging.export')} className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Export Excel</Link>
        </div>
        <div className="bg-white p-4 rounded shadow max-w-md">
          <Doughnut data={chartData} />
        </div>
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Days</th>
                <th className="px-4 py-2 text-left">Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2">{r.customer}</td>
                  <td className="px-4 py-2">{r.email || '-'}</td>
                  <td className="px-4 py-2">{r.phone || '-'}</td>
                  <td className="px-4 py-2 text-right">{formatPKR(Number(r.amount || 0))}</td>
                  <td className="px-4 py-2">{r.days}</td>
                  <td className="px-4 py-2">{r.bucket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
