/** Display formatters. Keep all user-facing number/date formatting here so it stays consistent. */

const inrFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("en-IN");
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const formatCurrency = (amount: number | null | undefined) => (amount == null ? "—" : inrFormatter.format(amount));

export const formatNumber = (n: number | null | undefined) => (n == null ? "—" : numberFormatter.format(n));

export const formatPercent = (n: number | null | undefined, digits = 1) => (n == null ? "—" : `${n.toFixed(digits)}%`);

/** Accepts ISO strings or `YYYY-MM-DD`. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export const initials = (name: string | null | undefined) =>
  (name ?? "")
    .split(/\s+/)
    .filter((part) => /^[A-Za-z]/.test(part) && !/^(dr|prof|er|mr|mrs|ms|shri)\.?$/i.test(part))
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";

/** Percentage of `part` in `whole`, or null when `whole` is 0. */
export const ratio = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);
