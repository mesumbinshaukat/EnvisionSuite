import React, { useMemo, useState } from 'react';

// Props: data: [{ label, value, color }], size?: number (px)
export default function SimplePie({ data = [], size = 180 }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const total = useMemo(() => data.reduce((s, d) => s + Math.max(0, Number(d.value || 0)), 0), [data]);
  const segments = useMemo(() => {
    let acc = 0;
    return data.map((d) => {
      const v = Math.max(0, Number(d.value || 0));
      const pct = total > 0 ? (v / total) : 0;
      const start = acc;
      const end = acc + pct;
      acc = end;
      return { ...d, pct, start, end };
    });
  }, [data, total]);

  const gradient = useMemo(() => {
    if (total === 0 || segments.length === 0) return 'conic-gradient(#eee 0 360deg)';
    const parts = segments.map((s, i) => {
      const a0 = Math.round(s.start * 360);
      const a1 = Math.round(s.end * 360);
      return `${s.color} ${a0}deg ${a1}deg`;
    });
    return `conic-gradient(${parts.join(',')})`;
  }, [segments, total]);

  const dim = size;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative mx-auto rounded-full shadow-inner"
        style={{ width: dim, height: dim, backgroundImage: gradient }}
        aria-label="Pie chart"
      >
        <div className="absolute inset-0 m-auto rounded-full bg-white" style={{ width: dim * 0.6, height: dim * 0.6 }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {segments.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            className={`flex items-center gap-2 rounded border px-2 py-1 ${hoverIndex === i ? 'bg-gray-50' : ''}`}
          >
            <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: s.color }} />
            <div className="flex-1 text-sm text-gray-700 truncate" title={s.label}>{s.label}</div>
            <div className="text-sm font-medium text-gray-900">
              {total > 0 ? `${Math.round(s.pct * 100)}%` : '0%'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
