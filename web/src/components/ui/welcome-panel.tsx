import type { ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";

interface WelcomePanelProps {
  /** Small line above the title (department, date…). */
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  /** Right-aligned actions. */
  actions?: ReactNode;
  /** Usually a row of <Stat>s. */
  children?: ReactNode;
  /** Use 2 when the page already has its own <h1> (PageHeader). */
  headingLevel?: 1 | 2;
}

/**
 * Dashboard greeting card. Replaces the old full-bleed gradient heroes: same
 * information, calmer surface, real contrast for every line of text.
 */
export function WelcomePanel({ eyebrow, title, subtitle, actions, children, headingLevel = 1 }: WelcomePanelProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="bg-white rounded-2xl border border-border-subtle shadow-xs overflow-hidden">
      <div className="h-1 bg-primary-container" aria-hidden />
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && <p className="text-sm font-medium text-primary-container">{eyebrow}</p>}
            <Heading className="text-2xl sm:text-[28px] sm:leading-9 font-semibold tracking-tight text-slate-900 font-headline mt-0.5">{title}</Heading>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Responsive grid for Stats inside a WelcomePanel. */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return (
    <dl
      className={clsx(
        "grid grid-cols-2 gap-px rounded-xl overflow-hidden border border-border-subtle bg-border-subtle",
        columns === 3 && "sm:grid-cols-3",
        columns === 4 && "sm:grid-cols-4",
      )}
    >
      {children}
    </dl>
  );
}

type StatTone = "default" | "success" | "warning" | "error";
const TONE: Record<StatTone, string> = {
  default: "text-slate-900",
  success: "text-emerald-700",
  warning: "text-amber-700",
  error: "text-red-700",
};

/** One labelled figure. `note` gives a text status so color is never the only signal. */
export function Stat({ label, value, note, tone = "default", href }: { label: string; value: ReactNode; note?: string; tone?: StatTone; href?: string }) {
  const content = (
    <>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1.5 flex-wrap">
        <span className={clsx("text-xl font-semibold font-tabular-nums tracking-tight", TONE[tone])}>{value}</span>
        {note && <span className={clsx("text-xs font-medium", tone === "default" ? "text-slate-500" : TONE[tone])}>{note}</span>}
      </dd>
    </>
  );
  return href ? (
    <Link href={href} className="bg-white px-4 py-3 hover:bg-slate-50 transition-colors block">
      {content}
    </Link>
  ) : (
    <div className="bg-white px-4 py-3">{content}</div>
  );
}
