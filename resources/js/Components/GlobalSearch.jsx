import { useMemo, useState } from 'react';

export default function GlobalSearch({ items }) {
  const [q, setQ] = useState('');
  const flat = useMemo(()=> items.flatMap(g => g.items.map(it => ({...it, group: g.label}))), [items]);
  const results = useMemo(()=>{
    if (!q.trim()) return [];
    const term = q.toLowerCase();
    return flat.filter(it => (it.label.toLowerCase().includes(term) || it.group.toLowerCase().includes(term))).slice(0,8);
  }, [q, flat]);

  return (
    <div className="relative w-64">
      <input
        value={q}
        onChange={(e)=> setQ(e.target.value)}
        placeholder="Search pages…"
        className="w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
      {results.length>0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          {results.map((r, idx)=> (
            <a key={idx} href={r.href} className="block px-3 py-2 text-sm hover:bg-indigo-50">
              <div className="font-medium text-gray-900">{r.label}</div>
              <div className="text-xs text-gray-500">{r.group}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
