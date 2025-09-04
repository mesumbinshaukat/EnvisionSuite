import React from 'react';
import { useI18n } from '@/i18n';

export default function FmtCurrency({ value, currency = 'PKR', options }) {
  const { currency: fmt } = useI18n();
  return <>{fmt(Number(value ?? 0), currency, options)}</>;
}
