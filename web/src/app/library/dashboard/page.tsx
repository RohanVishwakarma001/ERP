"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { operationsService } from "@/services/domain-services";
import { LibraryBookItem } from "@/types";
import { BookOpen, CheckCircle, RotateCcw, AlertTriangle } from "lucide-react";

export default function LibraryDashboardPage() {
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["libraryBooks"],
    queryFn: operationsService.getLibraryBooks,
  });

  const totalTitles = books.length;
  const totalCopies = books.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
  const availableCopies = books.reduce((sum, b) => sum + (b.availableCopies || 0), 0);
  const issuedCopies = Math.max(0, totalCopies - availableCopies);

  const columns: Column<LibraryBookItem>[] = [
    {
      header: "Accession # & Book Title",
      accessorKey: "title",
      sortable: true,
      cell: (b) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{b.title}</span>
          <span className="text-[11px] text-slate-500 font-mono">{b.accessionNumber} • {b.edition}</span>
        </div>
      ),
    },
    {
      header: "Authors",
      cell: (b) => <span className="text-xs text-slate-700">{b.authors.join(", ")}</span>,
    },
    {
      header: "Department",
      accessorKey: "department",
      sortable: true,
      cell: (b) => <span className="text-xs text-slate-600">{b.department}</span>,
    },
    {
      header: "Copies Available",
      cell: (b) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold font-tabular-nums text-emerald-700">
            {b.availableCopies} / {b.totalCopies} Available
          </span>
        </div>
      ),
    },
    {
      header: "Shelf Location",
      accessorKey: "shelfLocation",
      cell: (b) => (
        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {b.shelfLocation}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout role="LIBRARIAN">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Campus Infrastructure</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0B3B60]">Central Library</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Central Library RFID Circulation &amp; Inventory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated barcode catalog, student circulation records, overdue fine ledgers, and digital e-resource access.
            </p>
          </div>
          <Badge variant="success">Koha RFID System Online</Badge>
        </div>

        {/* 4 Library KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Volumes"
            value={totalCopies.toString()}
            unit="Copies"
            icon={<BookOpen className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft={`${totalTitles} Titles in Catalog`}
            footerRight="100% Barcoded"
            footerRightColor="success"
          />
          <KpiCard
            title="Active Circulations"
            value={issuedCopies.toString()}
            unit="Issued"
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            footerLeft="Student & Faculty Loans"
            footerRight="Active Borrows"
            footerRightColor="info"
          />
          <KpiCard
            title="Available Shelf Stock"
            value={availableCopies.toString()}
            unit="Volumes"
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            footerLeft="Available for Circulation"
            footerRight="Ready"
            footerRightColor="success"
          />
          <KpiCard
            title="Accession System"
            value="Koha RFID"
            unit="Active"
            icon={<RotateCcw className="w-5 h-5 text-indigo-600" />}
            footerLeft="Central Library JBIT"
            footerRight="OPAC Live"
            footerRightColor="neutral"
          />
        </div>

        <DataTable
          data={books}
          columns={columns}
          searchPlaceholder="Search by title, author, or accession number..."
          searchKey="title"
          pageSize={10}
          isLoading={isLoading}
          exportFileName="jbit-central-library-catalog"
        />
      </div>
    </DashboardLayout>
  );
}
