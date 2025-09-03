import React, { useMemo, useState } from 'react';

// Props: data: [{ label, value, color }]
export default function SimpleBar({ data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const max = useMemo(() => Math.max(0, ...data.map(d => Math.abs(Number(d.value) || 0))), [data]);

  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => {
        const val = Math.abs(Number(d.value) || 0);
        const pct = max > 0 ? (val / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-28 truncate text-sm text-gray-700" title={d.label}>{d.label}</div>
            <div className="flex-1">
              <div
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="h-3 rounded bg-gray-100"
              >
                <div
                  className={`h-3 rounded ${hoverIndex === i ? 'opacity-90' : 'opacity-80'}`}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: d.color,
                    transition: 'width 300ms ease',
                  }}
                />
              </div>
            </div>
            <div className="w-24 text-right text-sm text-gray-900">
              {Number(d.value || 0).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
