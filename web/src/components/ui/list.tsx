import type { ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";
import { initials } from "@/lib/format";

/** Initials avatar. Decorative: the name is always rendered next to it. */
export function Avatar({ name, size = "md", className }: { name?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "rounded-full bg-surface-container text-primary-container font-semibold flex items-center justify-center shrink-0",
        size === "sm" && "w-8 h-8 text-xs",
        size === "md" && "w-10 h-10 text-sm",
        size === "lg" && "w-14 h-14 text-lg",
        className,
      )}
    >
      {initials(name ?? undefined)}
    </div>
  );
}

interface ListRowProps {
  /** Leading visual: Avatar, icon tile or period marker. */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned content: badge, value, button. */
  trailing?: ReactNode;
  /** Makes the whole row a link with a chevron. */
  href?: string;
  /** Visually emphasise (e.g. the live class). */
  highlight?: boolean;
  /** De-emphasise (e.g. completed items). */
  muted?: boolean;
  className?: string;
}

/**
 * Standard list item: leading visual, two lines of text, trailing slot. Wraps
 * gracefully on narrow screens so trailing actions never overflow.
 */
export function ListRow({ leading, title, subtitle, trailing, href, highlight, muted, className }: ListRowProps) {
  const body = (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {leading}
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900 leading-5 break-words">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5 break-words">{subtitle}</div>}
        </div>
      </div>
      {trailing && <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">{trailing}</div>}
      {href && <ChevronRight aria-hidden className="w-4 h-4 text-slate-400 shrink-0" />}
    </>
  );
  const classes = clsx(
    "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
    highlight ? "bg-emerald-50 ring-1 ring-inset ring-emerald-600/20" : "hover:bg-slate-50",
    muted && "opacity-60",
    className,
  );
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/** Rounded square holding an icon or short label (e.g. "P3" for period 3). */
export function IconTile({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "success" | "warning" | "neutral" }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold [&_svg]:w-5 [&_svg]:h-5",
        tone === "brand" && "bg-surface-container-low text-primary-container",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "neutral" && "bg-slate-100 text-slate-600",
      )}
    >
      {children}
    </div>
  );
}
