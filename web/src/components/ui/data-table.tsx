"use client";

import React, { useState, useMemo } from "react";
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { clsx } from "clsx";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
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
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchKey,
  pageSize = 10,
  isLoading = false,
  emptyMessage = "No records found",
  emptySubMessage = "Try refining your search filters or adding a new record.",
  actions,
  filterComponent,
  onRowClick,
  exportFileName = "export",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((item) => {
      if (searchKey) {
        const val = String(item[searchKey] || "").toLowerCase();
        return val.includes(lower);
      }
      return Object.values(item as Record<string, unknown>).some((v) =>
        String(v || "").toLowerCase().includes(lower)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortOrder === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = columns.map((c) => c.header).join(",");
    const rows = sortedData.map((row) =>
      columns
        .map((col) => {
          if (col.accessorKey) {
            const val = String((row as Record<string, unknown>)[col.accessorKey as string] ?? "");
            return `"${val.replace(/"/g, '""')}"`;
          }
          return '""';
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exportFileName}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
      {/* Top Filter and Action Strip */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white">
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
            />
          </div>
          {filterComponent}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleExportCSV}
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-xs transition-colors"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          {actions}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="h-10 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={clsx("px-4 py-2 select-none", col.className)}
                  onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey)}
                >
                  <div className={clsx("flex items-center gap-1", col.sortable && "cursor-pointer hover:text-slate-900")}>
                    <span>{col.header}</span>
                    {col.sortable && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] text-sm text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="h-12 animate-pulse">
                  {columns.map((_, c) => (
                    <td key={c} className="px-4 py-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-base font-semibold text-slate-800">{emptyMessage}</p>
                    <p className="text-xs text-slate-500 mt-1">{emptySubMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={clsx(
                    "h-12 transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-[#F8FAFC]" : "hover:bg-[#F8FAFC]/50"
                  )}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={clsx("px-4 py-3", col.className)}>
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? String((item as Record<string, unknown>)[col.accessorKey as string] ?? "—")
                        : "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-800">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </span>{" "}
          of <span className="font-semibold text-slate-800">{sortedData.length}</span> entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            type="button"
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-semibold text-slate-800">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            type="button"
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
