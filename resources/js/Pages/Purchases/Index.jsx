import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Index({ purchases }) {
  const { props } = usePage();
  const vendorCreated = props.flash?.vendorCreated;
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Purchases</h2>}>
      <Head title="Purchases" />
      <div className="mx-auto max-w-7xl p-6 space-y-4">
        <div className="flex justify-between">
          <Link href={route('purchases.create')} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">New Purchase</Link>
        </div>
        <div className="overflow-x-auto rounded bg-white p-4 shadow">
          <table className="min-w-full">
            <thead><tr><th className="px-2 py-2 text-left">#</th><th className="px-2 py-2">Vendor</th><th className="px-2 py-2 text-right">Grand Total</th><th className="px-2 py-2 text-right">Paid</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Date</th></tr></thead>
            <tbody>
              {purchases.data.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-2 py-2">{p.id}</td>
                  <td className="px-2 py-2">{p.vendor?.name ?? p.vendor_name ?? '-'}</td>
                  <td className="px-2 py-2 text-right">{p.grand_total}</td>
                  <td className="px-2 py-2 text-right">{p.amount_paid}</td>
                  <td className="px-2 py-2">{p.status}</td>
                  <td className="px-2 py-2">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
