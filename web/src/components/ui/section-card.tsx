import type { ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Rendered at the right of the header (badge, link, button). */
  action?: ReactNode;
  /** Removes body padding — for full-bleed lists and tables. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

/** White card with an optional titled header — the standard content container. */
export function SectionCard({ title, subtitle, icon, action, flush = false, className, children }: SectionCardProps) {
  return (
    <section className={clsx("bg-white rounded-2xl border border-border-subtle shadow-xs min-w-0", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <span className="shrink-0 text-primary-container">{icon}</span>}
            <div className="min-w-0">
              {title && <h2 className="font-semibold text-[15px] leading-6 text-slate-900 font-headline truncate">{title}</h2>}
              {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={clsx(flush ? "" : "px-5 pb-5", !title && !action && !flush && "pt-5")}>{children}</div>
    </section>
  );
}

/** Text link used in card headers ("View all", "Manage"). */
export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-primary-container hover:underline underline-offset-4 rounded">
      {children}
    </Link>
  );
}
