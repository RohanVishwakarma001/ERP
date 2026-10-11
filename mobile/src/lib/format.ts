/** Display formatters shared by every screen. */

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export const formatCurrency = (amount: number | null | undefined) => (amount == null ? '—' : inrFormatter.format(amount));

/** "Dr. V. K. Bhatt" → "VB"; ignores honorifics. */
export function initials(name: string | null | undefined): string {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter((part) => /^[A-Za-z]/.test(part) && !/^(dr|prof|er|mr|mrs|ms|shri)\.?$/i.test(part))
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || '?'
  );
}
