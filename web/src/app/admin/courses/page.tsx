"use client";

import { useMemo } from "react";
import { Award, BookOpen, GraduationCap, Layers } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, QueryState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useCurriculum, useDepartments, type CurriculumSubject } from "@/features/departments";

type CurriculumRow = CurriculumSubject & { id: string };

const curriculumColumns: Column<CurriculumRow>[] = [
  {
    header: "Subject",
    accessorKey: "name",
    sortable: true,
    cell: (s) => (
      <div>
        <span className="font-medium text-slate-900 block">{s.name}</span>
        <span className="text-xs text-slate-500 font-mono">{s.code}</span>
      </div>
    ),
  },
  { header: "Department", accessorKey: "department", sortable: true },
  { header: "Semester", accessorKey: "semester", sortable: true, cell: (s) => <span className="font-tabular-nums">{s.semester}</span> },
  { header: "Type", accessorKey: "type", sortable: true, cell: (s) => <Badge variant={s.type === "PRACTICAL" ? "info" : "neutral"}>{s.type}</Badge> },
  { header: "Credits", accessorKey: "credits", sortable: true, cell: (s) => <span className="font-tabular-nums font-semibold">{s.credits}</span> },
];

export default function CoursesPage() {
  const departments = useDepartments();
  const curriculum = useCurriculum();

  const list = useMemo(() => departments.data ?? [], [departments.data]);
  const subjects = useMemo(() => curriculum.data ?? [], [curriculum.data]);
  const programCount = new Set(list.flatMap((d) => d.programs)).size;
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Academic Affairs", "Programs & Courses"]}
          title="Programs & Curriculum"
          description="Degree programs offered by each department and the subjects that make up the curriculum."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Programs" value={programCount} icon={<GraduationCap className="w-5 h-5" />} />
          <KpiCard title="Subjects" value={subjects.length} icon={<Layers className="w-5 h-5" />} />
          <KpiCard title="Total Credits" value={totalCredits} icon={<BookOpen className="w-5 h-5" />} />
          <KpiCard title="NBA Accredited" value={list.filter((d) => d.nbaAccredited).length} unit="Depts" icon={<Award className="w-5 h-5" />} />
        </div>

        <QueryState query={departments} empty={{ title: "No departments yet" }}>
          {(depts) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {depts.map((d) => (
                <div key={d.id} className="p-5 rounded-2xl border border-border-subtle bg-white shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{d.code}</span>
                    <Badge variant={d.nbaAccredited ? "success" : "neutral"}>{d.accreditationStatus}</Badge>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 leading-tight">{d.name}</h3>
                  <p className="text-xs text-slate-500">
                    HOD: <strong className="text-slate-700">{d.hodName ?? "Not assigned"}</strong> · {d.building}
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">{d.programs.join(", ") || "No programs"}</div>
                </div>
              ))}
            </div>
          )}
        </QueryState>

        <section aria-labelledby="curriculum-heading" className="space-y-3">
          <h2 id="curriculum-heading" className="text-[15px] font-semibold text-slate-900 font-headline">
            Curriculum
          </h2>
          {curriculum.isError ? (
            <ErrorState error={curriculum.error} onRetry={() => curriculum.refetch()} />
          ) : (
            <DataTable
              caption="Curriculum subjects"
              data={subjects.map((s) => ({ ...s, id: s.code }))}
              columns={curriculumColumns}
              searchPlaceholder="Search subjects or codes…"
              pageSize={15}
              isLoading={curriculum.isPending}
              emptyMessage="No subjects defined"
              exportFileName="jbit-curriculum"
            />
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
