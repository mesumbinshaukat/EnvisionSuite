import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useI18n } from '@/i18n';
import FmtCurrency from '@/Components/FmtCurrency';
import FmtDate from '@/Components/FmtDate';

export default function Index({ auth, loans }) {
  const { t } = useI18n();

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={t('money_loans')} />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" data-help-key="money_loans">{t('money_loans')}</h1>
          <Link href={route('money.loans.create')} className="px-3 py-2 bg-indigo-600 text-white rounded">{t('new_money_loan')}</Link>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2" data-help-key="money_loans_th_date">{t('date')}</th>
                  <th className="text-left px-4 py-2" data-help-key="money_loans_th_counterparty">{t('counterparty_type')}</th>
                  <th className="text-left px-4 py-2" data-help-key="money_loans_th_direction">{t('direction')}</th>
                  <th className="text-left px-4 py-2" data-help-key="money_loans_th_source">{t('source')}</th>
                  <th className="text-right px-4 py-2" data-help-key="money_loans_th_amount">{t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {(loans?.data || []).map(ln => (
                  <tr key={ln.id} className="border-t">
                    <td className="px-4 py-2"><FmtDate value={ln.date || ln.created_at} /></td>
                    <td className="px-4 py-2">
                      {ln.counterparty_type === 'vendor' ? (ln.vendor?.name || '—') : (ln.counterparty_name || '—')}
                    </td>
                    <td className="px-4 py-2">{ln.direction === 'lend' ? t('lend') : t('borrow')}</td>
                    <td className="px-4 py-2">{ln.source === 'bank' ? t('bank') : t('cash')}</td>
                    <td className="px-4 py-2 text-right"><FmtCurrency value={ln.amount} /></td>
                  </tr>
                ))}
                {(!loans?.data || loans.data.length === 0) && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* pagination minimal */}
          {loans?.links && (
            <div className="p-3 border-t flex gap-2 flex-wrap">
              {loans.links.map((l, idx) => (
                <a key={idx} href={l.url || '#'} className={`px-2 py-1 rounded ${l.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'} ${!l.url ? 'opacity-60 pointer-events-none' : ''}`}
                  dangerouslySetInnerHTML={{ __html: l.label }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
