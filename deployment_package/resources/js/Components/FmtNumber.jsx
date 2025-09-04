import React from 'react';
import { useI18n } from '@/i18n';

export default function FmtNumber({ value, options }) {
  const { n } = useI18n();
  return <>{n(value, options)}</>;
}
