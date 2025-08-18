export function formatPKR(value) {
  const num = Number(value || 0);
  // Keep simple Rs prefix; avoid locale commas if undesired. Adjust as needed.
  return `Rs ${num.toFixed(2)}`;
}
