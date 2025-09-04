import { useI18n } from '@/i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 hidden sm:block">{t('language')}:</label>
      <select
        value={locale}
        onChange={(e)=> setLocale(e.target.value)}
        className="rounded border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        <option value="en">{t('english')}</option>
        <option value="ur">{t('urdu')}</option>
      </select>
    </div>
  );
}
