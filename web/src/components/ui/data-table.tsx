"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { clsx } from "clsx";
import { EmptyState } from "./query-state";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  /** Hide this column in the stacked mobile layout (e.g. row actions shown elsewhere). */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  actions?: React.ReactNode;
  filterComponent?: React.ReactNode;
  onRowClick?: (item: T) => void;
  exportFileName?: string;
  /** Accessible table caption (visually hidden). */
  caption?: string;
}

function renderCell<T>(col: Column<T>, item: T) {
  if (col.cell) return col.cell(item);
  if (col.accessorKey) return String((item as Record<string, unknown>)[col.accessorKey as string] ?? "—");
  return "—";
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search records…",
  searchKey,
  pageSize = 10,
  isLoading = false,
  emptyMessage = "No records found",
  emptySubMessage = "Try a different search or filter.",
  actions,
  filterComponent,
  onRowClick,
  exportFileName = "export",
  caption,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (searchKey) return String(item[searchKey] ?? "").toLowerCase().includes(lower);
      return Object.values(item as Record<string, unknown>).some((v) => String(v ?? "").toLowerCase().includes(lower));
    });
  }, [data, searchTerm, searchKey]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === "number" && typeof valB === "number") return sortOrder === "asc" ? valA - valB : valB - valA;
      const cmp = String(valA).localeCompare(String(valB), undefined, { sensitivity: "base", numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  // Data can shrink (filter change, refetch) underneath the current page.
  const page = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => sortedData.slice((page - 1) * pageSize, page * pageSize), [sortedData, page, pageSize]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleExportCSV = () => {
    if (!sortedData.length) return;
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const exportable = columns.filter((c) => c.accessorKey);
    const rows = [
      exportable.map((c) => escape(c.header)).join(","),
      ...sortedData.map((row) => exportable.map((c) => escape((row as Record<string, unknown>)[c.accessorKey as string])).join(",")),
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ariaSort = (col: Column<T>) =>
    col.sortable && col.accessorKey && sortKey === col.accessorKey ? (sortOrder === "asc" ? "ascending" : "descending") : undefined;

  const rowProps = (item: T) =>
    onRowClick
      ? {
          onClick: () => onRowClick(item),
          onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowClick(item)),
          tabIndex: 0,
          role: "button" as const,
        }
      : {};

  const from = sortedData.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, sortedData.length);

  return (
    <div className="bg-white rounded-2xl border border-border-subtle shadow-xs overflow-hidden flex flex-col min-w-0">
      {/* Toolbar */}
      <div className="p-3 sm:p-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex-1 sm:max-w-sm">
            <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="search"
              aria-label={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-border-strong bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/10"
            />
          </div>
          {filterComponent}
        </div>
        <div className="flex items-center gap-2 justify-end" data-print-hide>
          <button
            onClick={handleExportCSV}
            type="button"
            disabled={sortedData.length === 0}
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border-strong bg-white text-slate-800 hover:bg-slate-50 text-sm font-medium shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download aria-hidden className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          {actions}
        </div>
      </div>

      {/* Desktop / tablet: real table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="bg-slate-50 border-b border-border-subtle">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  aria-sort={ariaSort(col)}
                  className={clsx("px-4 h-11 text-xs font-semibold text-slate-500 whitespace-nowrap", col.className)}
                >
                  {col.sortable && col.accessorKey ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.accessorKey!)}
                      className="inline-flex items-center gap-1 -mx-1 px-1 rounded hover:text-slate-900"
                    >
                      {col.header}
                      {sortKey === col.accessorKey ? (
                        sortOrder === "asc" ? (
                          <ArrowUp aria-hidden className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDown aria-hidden className="w-3.5 h-3.5" />
                        )
                      ) : (
                        <ArrowUpDown aria-hidden className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </button>
                  ) : (
                    col.header || <span className="sr-only">Actions</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-sm text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, c) => (
                    <td key={c} className="px-4 py-4">
                      <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState icon={<Search />} title={emptyMessage} description={emptySubMessage} />
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  {...rowProps(item)}
                  className={clsx("transition-colors", onRowClick ? "cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50" : "hover:bg-slate-50/60")}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={clsx("px-4 py-3 align-middle", col.className)}>
                      {renderCell(col, item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phone: each row becomes a labelled card so nothing is hidden off-screen */}
      <ul className="md:hidden divide-y divide-border-subtle" aria-label={caption}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="p-4 space-y-2 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </li>
          ))
        ) : paginatedData.length === 0 ? (
          <li>
            <EmptyState icon={<Search />} title={emptyMessage} description={emptySubMessage} />
          </li>
        ) : (
          paginatedData.map((item, idx) => {
            const [primary, ...rest] = columns.filter((c) => !c.hideOnMobile);
            return (
              <li key={item.id ?? idx} {...rowProps(item)} className={clsx("p-4 space-y-3", onRowClick && "active:bg-slate-50")}>
                {primary && <div className="text-sm">{renderCell(primary, item)}</div>}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {rest.map((col, c) =>
                    col.header ? (
                      <div key={c} className="min-w-0">
                        <dt className="text-xs text-slate-500 mb-0.5">{col.header}</dt>
                        <dd className="text-sm text-slate-800 break-words">{renderCell(col, item)}</dd>
                      </div>
                    ) : (
                      <div key={c} className="col-span-2 flex justify-end">
                        {renderCell(col, item)}
                      </div>
                    ),
                  )}
                </dl>
              </li>
            );
          })
        )}
      </ul>

      {/* Pagination */}
      <nav
        aria-label="Pagination"
        className="px-4 py-3 border-t border-border-subtle bg-slate-50/60 flex items-center justify-between gap-3 text-sm text-slate-600"
        data-print-hide
      >
        <p aria-live="polite">
          <span className="font-semibold text-slate-900 font-tabular-nums">
            {from}–{to}
          </span>{" "}
          of <span className="font-semibold text-slate-900 font-tabular-nums">{sortedData.length}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(Math.max(1, page - 1))}
            disabled={page === 1}
            type="button"
            aria-label="Previous page"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-border-strong bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-800 font-tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            type="button"
            aria-label="Next page"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-border-strong bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </div>
  );
}
