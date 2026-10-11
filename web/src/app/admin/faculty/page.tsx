"use client";

import { Award, BookOpen, Clock, Users2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useFacultyList, type FacultyMember } from "@/features/faculty";
import { initials } from "@/lib/format";

const isPhd = (f: FacultyMember) => /ph\.?\s?d/i.test(f.qualification);

const columns: Column<FacultyMember>[] = [
  {
    header: "Faculty",
    accessorKey: "name",
    sortable: true,
    cell: (f) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-semibold text-xs shrink-0">
          {initials(f.name)}
        </div>
        <div>
          <span className="font-semibold text-slate-900 text-xs block leading-tight">{f.name}</span>
          <span className="text-xs text-slate-500 font-mono">{f.employeeId}</span>
        </div>
      </div>
    ),
  },
  {
    header: "Department & Role",
    accessorKey: "designation",
    sortable: true,
    cell: (f) => (
      <div>
        <span className="font-medium text-slate-800 text-xs block">{f.designation}</span>
        <span className="text-xs text-slate-500">{f.department}</span>
      </div>
    ),
  },
  {
    header: "Qualification",
    accessorKey: "qualification",
    cell: (f) => (
      <div>
        <span className="font-medium text-slate-700 text-xs block">{f.qualification}</span>
        {f.specialization && <span className="text-xs text-slate-500">{f.specialization}</span>}
      </div>
    ),
  },
  {
    header: "Weekly Load",
    accessorKey: "weeklyWorkloadHours",
    sortable: true,
    cell: (f) => {
      const below = f.weeklyWorkloadHours < f.maxWorkloadHours;
      return (
        <div className="flex items-center gap-2">
          <span className={`font-semibold font-tabular-nums text-xs ${below ? "text-amber-700" : "text-slate-800"}`}>
            {f.weeklyWorkloadHours} / {f.maxWorkloadHours} h
          </span>
          {below && <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Below AICTE norm</span>}
        </div>
      );
    },
  },
  {
    header: "Classes",
    cell: (f) => (
      <div className="flex flex-wrap gap-1">
        {f.assignedSubjects.map((s) => (
          <span key={`${s.code}-${s.section}`} className="text-xs font-mono font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
            {s.code} ({s.section})
          </span>
        ))}
      </div>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: (f) => <Badge variant={f.status === "ACTIVE" ? "success" : "warning"}>{f.status === "ACTIVE" ? "Active" : "On leave"}</Badge>,
  },
];

export default function FacultyDirectoryPage() {
  const faculty = useFacultyList();
  const list = faculty.data ?? [];
  const totalHours = list.reduce((sum, f) => sum + f.weeklyWorkloadHours, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Academic Affairs", "Faculty"]}
          title="Faculty Workload"
          description="Weekly timetabled contact hours against each member's AICTE requirement, with qualifications and assigned classes."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Faculty" value={list.length} icon={<Users2 className="w-5 h-5" />} footerLeft={`${list.filter(isPhd).length} Ph.D holders`} />
          <KpiCard
            title="Average Load"
            value={list.length ? (totalHours / list.length).toFixed(1) : "—"}
            unit="h / week"
            icon={<Clock className="w-5 h-5" />}
          />
          <KpiCard
            title="Below AICTE Norm"
            value={list.filter((f) => f.weeklyWorkloadHours < f.maxWorkloadHours).length}
            icon={<Award className="w-5 h-5" />}
            footerRightColor="warning"
          />
          <KpiCard title="On Leave Today" value={list.filter((f) => f.status === "ON_LEAVE").length} icon={<BookOpen className="w-5 h-5" />} />
        </div>

        {faculty.isError ? (
          <ErrorState error={faculty.error} onRetry={() => faculty.refetch()} />
        ) : (
          <DataTable
            data={list}
            columns={columns}
            searchPlaceholder="Search faculty…"
            pageSize={10}
            isLoading={faculty.isPending}
            exportFileName="jbit-faculty-roster"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
