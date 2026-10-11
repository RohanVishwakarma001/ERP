import { BrandMark } from "./brand-mark";

/** Branded full-page loading screen (session restore, initial routing). */
export function FullScreenLoader({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="min-h-dvh bg-surface-canvas flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <BrandMark size={56} className="animate-pulse" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
