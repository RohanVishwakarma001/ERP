"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { CONTROL_CLASSES } from "@/components/ui/form-field";
import { BrandMark } from "./brand-mark";

/** Centered single-card layout shared by sign-in, forgot- and reset-password. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="min-h-dvh bg-surface-canvas flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center mb-8">
          <BrandMark size={64} />
          <p className="mt-4 text-sm font-medium text-primary-container">JB Institute of Technology, Dehradun</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 font-headline">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-sm">{subtitle}</p>}
        </div>
        <div className="bg-white rounded-2xl border border-border-subtle shadow-sm p-6 sm:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </main>
  );
}

/** Inline banner for form-level errors, announced to screen readers. */
export function FormAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "mb-5 p-3 rounded-xl border flex items-start gap-2.5 text-sm",
        tone === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800",
      )}
    >
      {tone === "error" ? <AlertCircle aria-hidden className="w-4 h-4 mt-0.5 shrink-0" /> : <Check aria-hidden className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

/** Password field with a show/hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} type={visible ? "text" : "password"} className={clsx(CONTROL_CLASSES, "h-11 pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
});

/** Mirrors backend/src/modules/auth/dto/auth.dto.ts STRONG_PASSWORD. */
export const PASSWORD_RULES = [
  { label: "8–72 characters", test: (p: string) => p.length >= 8 && p.length <= 72 },
  { label: "An uppercase and a lowercase letter", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  { label: "A symbol (e.g. @ # ! ?)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const isStrongPassword = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

/** Live checklist; each rule shows text + icon, not just a color change. */
export function PasswordRequirements({ value, id }: { value: string; id?: string }) {
  return (
    <ul id={id} className="space-y-1 mt-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.label} className={clsx("flex items-center gap-2 text-xs", ok ? "text-emerald-700" : "text-slate-500")}>
            <span
              aria-hidden
              className={clsx("w-4 h-4 rounded-full flex items-center justify-center", ok ? "bg-emerald-100" : "bg-slate-100")}
            >
              {ok && <Check className="w-3 h-3" />}
            </span>
            {rule.label}
            <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
