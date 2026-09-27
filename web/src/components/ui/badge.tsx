import React from "react";
import { clsx } from "clsx";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "primary";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  pulse?: boolean;
}

export function Badge({ children, variant = "neutral", className, pulse = false }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-800 border-amber-500/20",
    error: "bg-red-500/10 text-red-700 border-red-500/20",
    info: "bg-sky-500/10 text-sky-700 border-sky-500/20",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-[#0b3b60]/10 text-[#0b3b60] border-[#0b3b60]/20 font-semibold",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border leading-none tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "error" && "bg-red-500",
            variant === "info" && "bg-sky-500",
            variant === "primary" && "bg-[#0b3b60]"
          )}
        />
      )}
      {children}
    </span>
  );
}
