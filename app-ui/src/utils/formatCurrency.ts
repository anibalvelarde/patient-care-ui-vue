export function formatCurrency(value: number): string {
  // Group thousands with commas, always two decimals (e.g. 1050433.5 -> "$1,050,433.50").
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
