import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function PurchasesReport({ aggregates, chart }) {
  const days = chart?.days ?? 14;
  const labels = chart?.labels ?? [];
  const spend = chart?.spend ?? [];
  const qty = chart?.qty ?? [];

  // Compute scales for SVG
  const W = 920; // inner width
  const H = 280; // inner height
  const P = { t: 16, r: 40, b: 40, l: 48 };
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const n = labels.length || 1;
  const maxSpend = Math.max(1, ...spend);
  const maxQty = Math.max(1, ...qty);
  const x = (i) => P.l + (i * innerW) / Math.max(1, n - 1);
  const ySpend = (v) => P.t + innerH - (v / maxSpend) * innerH;
  const yQty = (v) => P.t + innerH - (v / maxQty) * innerH;

  const spendPath = spend.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${ySpend(v)}`).join(' ');
  const barW = Math.min(24, innerW / Math.max(1, n) * 0.6);

  const PeriodLink = ({ d, children }) => (
    <Link href={route('reports.purchases', { days: d })} preserveState preserveScroll className={`px-3 py-1 rounded border text-sm ${days === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
      {children}
    </Link>
  );

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Purchases Report</h2>}>
      <Head title="Purchases Report" />
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Total Spend</div><div className="text-2xl font-semibold">{(aggregates.totalSpend ?? 0).toFixed(2)}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Total Quantity</div><div className="text-2xl font-semibold">{aggregates.totalQty ?? 0}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Avg Unit Cost</div><div className="text-2xl font-semibold">{(aggregates.avgUnitCost ?? 0).toFixed(2)}</div></div>
          <div className="rounded bg-white p-4 shadow"><div className="text-sm text-gray-600">Outstanding Payables</div><div className="text-2xl font-semibold">{(aggregates.outstanding ?? 0).toFixed(2)}</div></div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Purchases over time</h3>
          <div className="flex gap-2">
            <PeriodLink d={7}>7d</PeriodLink>
            <PeriodLink d={14}>14d</PeriodLink>
            <PeriodLink d={30}>30d</PeriodLink>
          </div>
        </div>

        <div className="rounded bg-white p-4 shadow overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-72">
            {/* Axes */}
            <line x1={P.l} y1={P.t + innerH} x2={P.l + innerW} y2={P.t + innerH} stroke="#E5E7EB" />
            <line x1={P.l} y1={P.t} x2={P.l} y2={P.t + innerH} stroke="#E5E7EB" />

            {/* Spend line and area */}
            <path d={`${spendPath} L ${P.l + innerW} ${P.t + innerH} L ${P.l} ${P.t + innerH} Z`} fill="rgba(99,102,241,0.12)" />
            <path d={spendPath} fill="none" stroke="#6366F1" strokeWidth="2" />

            {/* Qty bars */}
            {qty.map((v, i) => (
              <rect key={i} x={x(i) - barW / 2} y={yQty(v)} width={barW} height={P.t + innerH - yQty(v)} fill="#10B981" opacity="0.7" />
            ))}

            {/* Y-axis labels (left for spend, right for qty) */}
            <text x={P.l - 8} y={P.t + 10} textAnchor="end" fontSize="10" fill="#6B7280">Spend</text>
            <text x={P.l + innerW + 8} y={P.t + 10} textAnchor="start" fontSize="10" fill="#6B7280">Qty</text>

            {/* X-axis labels (sparse to avoid clutter) */}
            {labels.map((d, i) => (
              (n <= 12 || i % Math.ceil(n / 12) === 0) ? (
                <text key={i} x={x(i)} y={P.t + innerH + 16} textAnchor="middle" fontSize="10" fill="#6B7280">{d.slice(5)}</text>
              ) : null
            ))}
          </svg>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-indigo-500"></span> Spend</div>
            <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-emerald-500"></span> Quantity</div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
