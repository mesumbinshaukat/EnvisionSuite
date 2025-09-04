import React from 'react';
import { useI18n } from '@/i18n';

export default function FmtDate({ value, options = { year: 'numeric', month: 'short', day: 'numeric' } }) {
  const { date } = useI18n();
  return <>{date(value, options)}</>;
}
