/**
 * Minimal global toast store. Framework-agnostic so it can be called from React
 * Query callbacks and plain functions, and read in React via `useToasts()`.
 */
export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const DISMISS_AFTER_MS: Record<ToastTone, number> = { success: 4000, info: 4000, error: 7000 };

let toasts: Toast[] = [];
/** Stable reference: useSyncExternalStore requires snapshots to be referentially cached. */
const SERVER_SNAPSHOT: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(tone: ToastTone, message: string) {
  const id = nextId++;
  toasts = [...toasts.slice(-4), { id, tone, message }];
  emit();
  setTimeout(() => dismissToast(id), DISMISS_AFTER_MS[tone]);
  return id;
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
};

export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => toasts,
  getServerSnapshot: (): Toast[] => SERVER_SNAPSHOT,
};
