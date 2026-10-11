"use client";

import { Award, CheckCircle2, Clock, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { usePlacementApplications, type ApplicationStatus, type PlacementApplication } from "@/features/placement";
import { formatDate, initials } from "@/lib/format";

const STATUS_VARIANT: Record<ApplicationStatus, BadgeVariant> = {
  APPLIED: "neutral",
  SHORTLISTED: "info",
  INTERVIEW_SCHEDULED: "warning",
  OFFERED: "success",
  REJECTED: "error",
};

const columns: Column<PlacementApplication>[] = [
  {
    header: "Candidate",
    accessorKey: "studentName",
    sortable: true,
    cell: (a) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-semibold text-xs shrink-0">
          {initials(a.studentName)}
        </div>
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{a.studentName}</span>
          <span className="text-xs text-slate-500 font-mono">
            #{a.rollNumber} · CGPA {a.cgpa.toFixed(2)}
          </span>
        </div>
      </div>
    ),
  },
  {
    header: "Company & Role",
    accessorKey: "companyName",
    sortable: true,
    cell: (a) => (
      <div>
        <span className="font-semibold text-slate-800 text-xs block">{a.companyName}</span>
        <span className="text-xs text-slate-500">{a.roleTitle}</span>
      </div>
    ),
  },
  {
    header: "Applied",
    accessorKey: "appliedAt",
    sortable: true,
    cell: (a) => <span className="text-xs text-slate-500">{formatDate(a.appliedAt)}</span>,
  },
  {
    header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: (a) => <Badge variant={STATUS_VARIANT[a.status]}>{a.status.replace("_", " ")}</Badge>,
  },
  {
    header: "Offer / LOI",
    cell: (a) =>
      a.status !== "OFFERED" ? (
        <span className="text-xs text-slate-400">—</span>
      ) : (
        <div>
          <span className="text-xs font-semibold text-emerald-700 block">{a.offerCtc ?? "Offer made"}</span>
          <span className="text-xs text-slate-500">{a.loiSigned ? `LOI signed ${formatDate(a.loiSignedAt)}` : "Awaiting student signature"}</span>
        </div>
      ),
  },
];

export default function OffersAndLoiPage() {
  const applications = usePlacementApplications();
  const list = applications.data ?? [];
  const offered = list.filter((a) => a.status === "OFFERED");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Training & Placement", "Offers & LOI"]}
          title="Applications, Offers & LOI"
          description="Every placement application with its stage. Students accept their Letter of Intent from their own dashboard."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Applications" value={list.length} icon={<Users className="w-5 h-5" />} />
          <KpiCard
            title="In Process"
            value={list.filter((a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW_SCHEDULED").length}
            icon={<Clock className="w-5 h-5 text-amber-700" />}
          />
          <KpiCard title="Offers" value={offered.length} icon={<Award className="w-5 h-5 text-emerald-700" />} />
          <KpiCard title="LOIs Signed" value={offered.filter((a) => a.loiSigned).length} unit={`of ${offered.length}`} icon={<CheckCircle2 className="w-5 h-5" />} />
        </div>

        {applications.isError ? (
          <ErrorState error={applications.error} onRetry={() => applications.refetch()} />
        ) : (
          <DataTable
            data={list}
            columns={columns}
            searchPlaceholder="Search candidates…"
            pageSize={10}
            isLoading={applications.isPending}
            exportFileName="jbit-placement-applications"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
