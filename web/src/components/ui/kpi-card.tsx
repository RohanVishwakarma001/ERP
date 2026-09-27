import React from "react";
import { clsx } from "clsx";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  footerLeft?: string | React.ReactNode;
  footerRight?: string | React.ReactNode;
  footerRightColor?: "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  icon,
  footerLeft,
  footerRight,
  footerRightColor = "success",
  className,
}: KpiCardProps) {
  const footerColorMap = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    error: "text-red-600",
    info: "text-sky-600",
    neutral: "text-slate-600",
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-tabular-nums">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-slate-600">{unit}</span>}
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#0B3B60] shrink-0">
          {icon}
        </div>
      </div>

      {(footerLeft || footerRight) && (
        <div className="mt-4 pt-3 flex items-center justify-between bg-[#F8FAFC] -mx-5 -mb-5 px-5 py-2.5 border-t border-[#F1F5F9] text-[11px]">
          <span className="text-slate-500 truncate">{footerLeft}</span>
          <span className={clsx("font-semibold flex items-center gap-1 shrink-0", footerColorMap[footerRightColor])}>
            {footerRight}
          </span>
        </div>
      )}
    </div>
  );
}
