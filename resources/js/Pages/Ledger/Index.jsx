import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function LedgerIndex({ balances, recent }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Ledger</h2>}>
      <Head title="Ledger" />
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-2 text-lg font-semibold">Balances</h3>
          <div className="grid grid-cols-2 gap-4">
            {balances.map((b, i)=> (
              <div key={i} className="rounded border p-3"><div className="text-sm text-gray-600">{b.currency}</div><div className="text-xl font-semibold">{b.total}</div></div>
            ))}
          </div>
        </div>
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-2 text-lg font-semibold">Recent Journal Entries</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead><tr><th className="px-2 py-2 text-left">ID</th><th className="px-2 py-2 text-left">Date</th><th className="px-2 py-2 text-left">Currency</th><th className="px-2 py-2 text-left">Description</th></tr></thead>
              <tbody>
                {recent.map(r=> (
                  <tr key={r.journalEntryId} className="border-t">
                    <td className="px-2 py-2">{r.journalEntryId}</td>
                    <td className="px-2 py-2">{r.transDate}</td>
                    <td className="px-2 py-2">{r.currency}</td>
                    <td className="px-2 py-2">{r.description}</td>
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
