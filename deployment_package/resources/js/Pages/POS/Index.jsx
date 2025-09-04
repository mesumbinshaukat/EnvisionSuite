import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useI18n } from '@/i18n';

export default function POS() {
  const { t } = useI18n();
  useEffect(() => {
    try { router.visit(route('sales.create')); } catch {}
  }, []);
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">{t('sales')}</h2>}>
      <Head title={t('sales')} />
      <div className="p-6 text-sm text-gray-600">{t('pos_disabled_redirecting')}</div>
    </AuthenticatedLayout>
  );
}
