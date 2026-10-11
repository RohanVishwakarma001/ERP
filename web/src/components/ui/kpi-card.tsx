import type { ReactNode } from "react";
import { clsx } from "clsx";

type Tone = "success" | "warning" | "error" | "info" | "neutral";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  footerRightColor?: Tone;
  className?: string;
}

const TONE_TEXT: Record<Tone, string> = {
  success: "text-emerald-700",
  warning: "text-amber-700",
  error: "text-red-700",
  info: "text-sky-700",
  neutral: "text-slate-600",
};

/** Headline metric. Not interactive, so it has no hover affordance. */
export function KpiCard({ title, value, unit, icon, footerLeft, footerRight, footerRightColor = "neutral", className }: KpiCardProps) {
  return (
    <div className={clsx("bg-white rounded-2xl p-5 border border-border-subtle shadow-xs flex flex-col min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 leading-5">{title}</p>
        <div aria-hidden className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-[28px] leading-9 font-semibold tracking-tight text-slate-900 font-tabular-nums">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {(footerLeft || footerRight) && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 truncate">{footerLeft}</span>
          {footerRight && <span className={clsx("font-semibold shrink-0", TONE_TEXT[footerRightColor])}>{footerRight}</span>}
        </div>
      )}
    </div>
  );
}
