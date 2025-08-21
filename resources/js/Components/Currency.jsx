export default function Currency({ value, className = '' }) {
  const n = Number(value || 0);
  const formatted = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
  // Ensure Rs symbol if environment lacks narrow symbol
  const withRs = formatted.replace(/^PKR\s?/, 'Rs ');
  return <span className={className}>{withRs}</span>;
}
