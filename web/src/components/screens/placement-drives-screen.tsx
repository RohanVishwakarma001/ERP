"use client";

import { Award, Briefcase, Building2, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { usePlacementDrives, type PlacementDrive } from "@/features/placement";
import { formatDate, formatNumber } from "@/lib/format";

const columns: Column<PlacementDrive>[] = [
  {
    header: "Company & Role",
    accessorKey: "companyName",
    sortable: true,
    cell: (d) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface-container-low border border-surface-container-high flex items-center justify-center font-semibold text-xs text-primary-container shrink-0">
          {d.companyName.charAt(0)}
        </div>
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">{d.companyName}</span>
          <span className="text-xs text-slate-500">{d.roleTitle}</span>
        </div>
      </div>
    ),
  },
  {
    header: "CTC",
    accessorKey: "ctc",
    sortable: true,
    cell: (d) => (
      <div>
        <span className="font-semibold text-emerald-700 block leading-tight font-tabular-nums">{d.ctc}</span>
        <span className="text-xs text-slate-500">{d.location}</span>
      </div>
    ),
  },
  {
    header: "Eligibility",
    cell: (d) => (
      <div>
        <span className="text-xs font-semibold text-slate-800 block">CGPA ≥ {d.minCgpa}</span>
        <span className="text-xs text-slate-500">
          Max {d.maxBacklogsAllowed} backlogs{d.allowedBatches ? ` · Batch ${d.allowedBatches}` : ""}
        </span>
      </div>
    ),
  },
  {
    header: "Funnel",
    cell: (d) => (
      <div className="flex items-center gap-3 text-xs font-tabular-nums">
        <Stat label="Applied" value={d.registeredCount} />
        <Stat label="Shortlisted" value={d.shortlistedCount} className="text-amber-700" />
        <Stat label="Offers" value={d.offersCount} className="text-emerald-700 font-semibold" />
      </div>
    ),
  },
  {
    header: "Deadline",
    accessorKey: "deadline",
    sortable: true,
    cell: (d) => <span className="text-xs text-slate-700">{formatDate(d.deadline)}</span>,
  },
  {
    header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: (d) => <Badge variant={d.status === "LIVE" ? "success" : "neutral"}>{d.status === "LIVE" ? "Open" : "Closed"}</Badge>,
  },
];

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <span className="text-xs text-slate-400 block">{label}</span>
      <span className={className ?? "font-semibold text-slate-800"}>{value}</span>
    </div>
  );
}

export function PlacementDrivesScreen() {
  const drives = usePlacementDrives();
  const list = drives.data ?? [];
  const sum = (key: "registeredCount" | "offersCount") => list.reduce((n, d) => n + d[key], 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Academic Affairs", "Training & Placement"]}
          title="Placement Drives"
          description="Campus recruitment drives with eligibility criteria and live application funnels."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Companies" value={new Set(list.map((d) => d.companyName)).size} icon={<Building2 className="w-5 h-5" />} />
          <KpiCard title="Open Drives" value={list.filter((d) => d.status === "LIVE").length} icon={<Briefcase className="w-5 h-5" />} />
          <KpiCard title="Applications" value={formatNumber(sum("registeredCount"))} icon={<TrendingUp className="w-5 h-5" />} />
          <KpiCard title="Offers" value={formatNumber(sum("offersCount"))} icon={<Award className="w-5 h-5 text-emerald-700" />} />
        </div>

        {drives.isError ? (
          <ErrorState error={drives.error} onRetry={() => drives.refetch()} />
        ) : (
          <DataTable
            data={list}
            columns={columns}
            searchPlaceholder="Search companies…"
            pageSize={10}
            isLoading={drives.isPending}
            exportFileName="jbit-placement-drives"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
