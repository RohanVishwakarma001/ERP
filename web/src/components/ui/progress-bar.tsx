import { clsx } from "clsx";

export type Tone = "success" | "warning" | "error" | "info" | "neutral";

const TONE_BAR: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-primary-container",
  neutral: "bg-slate-400",
};

export const TONE_TEXT: Record<Tone, string> = {
  success: "text-emerald-700",
  warning: "text-amber-700",
  error: "text-red-700",
  info: "text-primary-container",
  neutral: "text-slate-600",
};

interface ProgressBarProps {
  /** 0–100; values outside the range are clamped. */
  value: number;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressBar({ value, tone = "info", size = "sm", className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={clsx("w-full rounded-full bg-slate-200/70 overflow-hidden", size === "sm" ? "h-1.5" : "h-2", className)}
    >
      <div className={clsx("h-full rounded-full transition-all", TONE_BAR[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
