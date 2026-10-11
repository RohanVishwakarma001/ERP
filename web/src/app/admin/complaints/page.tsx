"use client";

import { AlertTriangle, CheckCircle2, Clock, HelpCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useComplaints, type Complaint } from "@/features/campus";
import { formatDate, formatPercent, ratio } from "@/lib/format";

const STATUS_VARIANT: Record<Complaint["status"], BadgeVariant> = {
  OPEN: "error",
  ASSIGNED: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const columns: Column<Complaint>[] = [
  {
    header: "Ticket",
    accessorKey: "title",
    sortable: true,
    cell: (t) => (
      <div>
        <span className="font-semibold text-slate-900 text-xs block leading-tight">{t.title}</span>
        <span className="text-xs text-slate-500 font-mono">
          {t.ticketNumber} · {t.reportedBy}
        </span>
      </div>
    ),
  },
  {
    header: "Category",
    accessorKey: "category",
    sortable: true,
    cell: (t) => <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">{t.category}</span>,
  },
  {
    header: "Priority",
    accessorKey: "priority",
    sortable: true,
    cell: (t) => <Badge variant={t.priority === "URGENT" || t.priority === "HIGH" ? "error" : "neutral"}>{t.priority}</Badge>,
  },
  {
    header: "Filed",
    accessorKey: "createdAt",
    sortable: true,
    cell: (t) => <span className="text-xs text-slate-500">{formatDate(t.createdAt)}</span>,
  },
  {
    header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: (t) => <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>,
  },
];

export default function ComplaintsPage() {
  const complaints = useComplaints();
  const list = complaints.data ?? [];
  const count = (...statuses: Complaint["status"][]) => list.filter((c) => statuses.includes(c.status)).length;
  const resolved = count("RESOLVED", "CLOSED");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Student Affairs", "Grievances"]}
          title="Grievance Desk"
          description="Complaints raised by students about hostel, academics, transport, infrastructure and finance."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Tickets"
            value={list.length}
            icon={<HelpCircle className="w-5 h-5" />}
            footerLeft={`${formatPercent(ratio(resolved, list.length), 0)} resolved`}
          />
          <KpiCard title="Open" value={count("OPEN")} icon={<AlertTriangle className="w-5 h-5 text-red-700" />} />
          <KpiCard title="In Progress" value={count("ASSIGNED", "IN_PROGRESS")} icon={<Clock className="w-5 h-5 text-amber-700" />} />
          <KpiCard title="Resolved" value={resolved} icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />} />
        </div>

        {complaints.isError ? (
          <ErrorState error={complaints.error} onRetry={() => complaints.refetch()} />
        ) : (
          <DataTable
            data={list}
            columns={columns}
            searchPlaceholder="Search tickets…"
            pageSize={10}
            isLoading={complaints.isPending}
            exportFileName="jbit-grievances"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
