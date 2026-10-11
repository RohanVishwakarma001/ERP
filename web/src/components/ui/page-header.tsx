import { Fragment, type ReactNode } from "react";

interface PageHeaderProps {
  /** Breadcrumb trail; the last item is the current page. */
  breadcrumbs?: string[];
  title: string;
  description?: string;
  /** Rendered next to the title (e.g. a status pill). */
  badge?: ReactNode;
  /** Right-aligned buttons. */
  actions?: ReactNode;
}

export function PageHeader({ breadcrumbs = [], title, description, badge, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
              {breadcrumbs.map((crumb, i) => (
                <Fragment key={crumb}>
                  {i > 0 && (
                    <li aria-hidden className="text-slate-300">
                      /
                    </li>
                  )}
                  <li aria-current={i === breadcrumbs.length - 1 ? "page" : undefined}>{crumb}</li>
                </Fragment>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <h1 className="text-2xl sm:text-[28px] sm:leading-9 font-semibold tracking-tight text-slate-900 font-headline">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0" data-print-hide>{actions}</div>}
    </header>
  );
}
