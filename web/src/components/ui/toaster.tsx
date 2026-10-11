"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { clsx } from "clsx";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { dismissToast, toastStore, type ToastTone } from "@/lib/toast-store";

const TONE_ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 aria-hidden className="w-5 h-5 text-emerald-700 shrink-0" />,
  error: <XCircle aria-hidden className="w-5 h-5 text-red-700 shrink-0" />,
  info: <Info aria-hidden className="w-5 h-5 text-primary-container shrink-0" />,
};

/** Renders the global toast stack. Mount once, in the root providers. */
export function Toaster() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getServerSnapshot);

  return (
    <div
      aria-live="polite"
      className="fixed z-[100] flex flex-col gap-2 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={clsx(
            "flex items-start gap-3 p-3.5 rounded-2xl bg-white border shadow-lg text-sm text-slate-800 animate-in fade-in slide-in-from-bottom-2",
            t.tone === "error" ? "border-red-200" : "border-border-subtle",
          )}
        >
          {TONE_ICONS[t.tone]}
          <span className="flex-1 leading-5">{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="-m-1 p-1 rounded-md text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
