import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";

/** Full-page message for 403 / 404 / runtime errors. */
export function StatusPage({ code, icon, title, children, actions }: { code?: string; icon?: ReactNode; title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <main className="min-h-dvh bg-surface-canvas flex flex-col items-center justify-center px-4 py-12 text-center">
      <BrandMark size={44} className="mb-8 opacity-90" />
      <div className="w-full max-w-md bg-white rounded-2xl border border-border-subtle shadow-sm p-8">
        {icon && (
          <div aria-hidden className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-600 [&_svg]:w-6 [&_svg]:h-6">
            {icon}
          </div>
        )}
        {code && <p className="text-sm font-semibold text-primary-container font-tabular-nums">{code}</p>}
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 font-headline">{title}</h1>
        <div className="mt-2 text-sm text-slate-500 leading-relaxed">{children}</div>
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">{actions}</div>
      </div>
    </main>
  );
}
