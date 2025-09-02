import React from 'react';
import Tooltip from '@/Components/Tooltip';
import { useI18n } from '@/i18n';

export default function InfoIcon({ help, helpKey, position = 'top', className = '' }) {
  const { helpText } = useI18n();
  const text = helpKey ? helpText(helpKey) : (help || '');
  if (!text) return null;
  return (
    <Tooltip text={text} position={position}>
      <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-gray-700 text-[10px] leading-none ${className}`}>i</span>
    </Tooltip>
  );
}
