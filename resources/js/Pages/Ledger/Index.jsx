import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Tooltip from '@/Components/Tooltip';
import Currency from '@/Components/Currency';

export default function LedgerIndex({ filters = {}, kpis = {}, recent = [], topAccounts = [] }) {
  const { data, setData, get, processing } = useForm({
    from: filters.from || '',
    to: filters.to || '',
  });

  const apply = (e) => {
    e.preventDefault();
    get(route('ledger.index'));
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Ledger</h2>}>
      <Head title="Ledger" />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <form onSubmit={apply} className="rounded bg-white p-4 shadow space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">From <Tooltip text="Filter entries from this date.">i</Tooltip></label>
              <input type="date" value={data.from} onChange={(e)=>setData('from', e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1">To <Tooltip text="Filter entries up to this date.">i</Tooltip></label>
              <input type="date" value={data.to} onChange={(e)=>setData('to', e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={processing} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Apply Filters</button>
            <Link href={route('ledger.index')} className="rounded border px-4 py-2">Reset</Link>
          </div>
        </form>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Cash on Hand <Tooltip text="All cash/till/petty cash accounts.">i</Tooltip></div>
            <div className="mt-1 text-2xl font-semibold"><Currency value={kpis.cash_on_hand} /></div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Bank Balance <Tooltip text="All bank/current/checking accounts.">i</Tooltip></div>
            <div className="mt-1 text-2xl font-semibold"><Currency value={kpis.bank_balance} /></div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-sm text-gray-600 flex items-center gap-1">Credit (Payables) <Tooltip text="Liabilities such as payables and credit cards.">i</Tooltip></div>
            <div className="mt-1 text-2xl font-semibold"><Currency value={kpis.credit_balance} /></div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded bg-white p-4 shadow overflow-x-auto">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Entries</h3>
              <Tooltip text="Last 20 journal entries.">i</Tooltip>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Memo</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr><td colSpan={2} className="px-2 py-6 text-center text-gray-500">No entries</td></tr>
                )}
                {recent.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-2">{r.date}</td>
                    <td className="px-2 py-2">{r.memo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded bg-white p-4 shadow overflow-x-auto">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Top Accounts</h3>
              <Tooltip text="Accounts with largest movement in range.">i</Tooltip>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-2">Account</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2 text-right">Debit</th>
                  <th className="px-2 py-2 text-right">Credit</th>
                  <th className="px-2 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.length === 0 && (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-gray-500">No data</td></tr>
                )}
                {topAccounts.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="px-2 py-2">{a.name}</td>
                    <td className="px-2 py-2 capitalize">{a.type}</td>
                    <td className="px-2 py-2 text-right"><Currency value={a.debit_sum} /></td>
                    <td className="px-2 py-2 text-right"><Currency value={a.credit_sum} /></td>
                    <td className={`px-2 py-2 text-right ${Number(a.balance) < 0 ? 'text-red-600' : ''}`}><Currency value={a.balance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
