import type { ReactNode } from "react";
import { clsx } from "clsx";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "primary";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  /** Shows a status dot (pulsing) — e.g. for "live" states. */
  pulse?: boolean;
}

const VARIANTS: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/25",
  error: "bg-red-50 text-red-800 ring-red-600/20",
  info: "bg-sky-50 text-sky-800 ring-sky-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/15",
  primary: "bg-surface-container-low text-primary-container ring-primary-container/20",
};

const DOTS: Record<BadgeVariant, string> = {
  success: "bg-emerald-600",
  warning: "bg-amber-600",
  error: "bg-red-600",
  info: "bg-sky-600",
  neutral: "bg-slate-500",
  primary: "bg-primary-container",
};

/** Compact status label. Always carries text, so meaning never depends on color alone. */
export function Badge({ children, variant = "neutral", className, pulse = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset leading-5 whitespace-nowrap",
        VARIANTS[variant],
        className,
      )}
    >
      {pulse && <span aria-hidden className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", DOTS[variant])} />}
      {children}
    </span>
  );
}
