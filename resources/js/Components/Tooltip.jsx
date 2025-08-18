import React from 'react';

export default function Tooltip({ text, children, position = 'top' }) {
  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <span className="relative inline-block group align-middle">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-[11px] leading-none select-none cursor-help" aria-label={text} role="img">{children ?? 'i'}</span>
      <span className={`pointer-events-none absolute z-50 hidden whitespace-pre rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block ${pos}`}>
        {text}
      </span>
    </span>
  );
}
