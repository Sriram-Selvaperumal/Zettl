/**
 * Formats a number as Indian Rupee currency string.
 * Examples:
 *   formatCurrency(1450)   → "₹1,450.00"
 *   formatCurrency(450.5)  → "₹450.50"
 *   formatCurrency(-200)   → "-₹200.00"
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formats a compact balance label.
 * Example: 1500 → "+₹1,500", -500 → "-₹500"
 */
export function formatBalanceLabel(amount: number): string {
  const prefix = amount >= 0 ? "+" : "";
  return `${prefix}${formatCurrency(amount)}`;
}
