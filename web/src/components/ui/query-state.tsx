import type { ReactNode } from "react";
import { clsx } from "clsx";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";
import { getErrorMessage } from "@/lib/api/api-error";

/** Placeholder bars shaped like a list — reads as "content is coming", not "stuck". */
export function LoadingState({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="py-2 space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded bg-slate-100 w-2/3" />
            <div className="h-3 rounded bg-slate-100 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={clsx("flex flex-col items-center justify-center text-center gap-2", compact ? "py-6" : "py-10")}>
      <div aria-hidden className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5">
        {icon ?? <Inbox />}
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center text-center py-10 gap-2">
      <div aria-hidden className="w-11 h-11 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-slate-900">Couldn&apos;t load this section</p>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{getErrorMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-primary-container hover:bg-surface-container-low"
        >
          <RotateCw className="w-4 h-4" /> Try again
        </button>
      )}
    </div>
  );
}

interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface QueryStateProps<T> {
  query: QueryLike<T>;
  /** Treat the data as empty (defaults to empty arrays). */
  isEmpty?: (data: T) => boolean;
  empty?: { title: string; description?: string; icon?: ReactNode; action?: ReactNode };
  loadingLabel?: string;
  /** Custom loading placeholder (e.g. a skeleton shaped like the content). */
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Renders loading / error (with retry) / empty / data states for a React Query
 * result, so every data-driven section handles all four consistently.
 */
export function QueryState<T>({ query, isEmpty, empty, loadingLabel, loading, children }: QueryStateProps<T>) {
  if (query.isPending) return <>{loading ?? <LoadingState label={loadingLabel} />}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const data = query.data as T;
  const emptyCheck = isEmpty ?? ((d: T) => Array.isArray(d) && d.length === 0);
  if (empty && emptyCheck(data)) return <EmptyState {...empty} />;
  return <>{children(data)}</>;
}
