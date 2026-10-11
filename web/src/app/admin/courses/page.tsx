"use client";

import { useMemo, useState } from "react";
import { Award, BookOpen, GraduationCap, Layers, PlusCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { RowActions } from "@/components/academics/row-actions";
import { DEGREE_LABELS, ProgramDialog } from "@/components/academics/program-dialog";
import { SectionDialog } from "@/components/academics/section-dialog";
import { CourseDialog, SUBJECT_TYPE_LABELS } from "@/components/academics/course-dialog";
import {
  useCurriculum,
  useDeleteProgram,
  useDeleteSection,
  useDeleteSubject,
  useDepartments,
  usePrograms,
  useSections,
  type CurriculumSubject,
  type Program,
  type Section,
} from "@/features/departments";
import { useAuth } from "@/features/auth";
import { canManageCurriculum, canManageInDepartment, canManageSections } from "@/lib/auth/academic-permissions";
import { toast } from "@/lib/toast-store";

type Editing =
  | { kind: "program"; item: Program | null }
  | { kind: "section"; item: Section | null }
  | { kind: "course"; item: CurriculumSubject | null };

type Deleting =
  | { kind: "program"; item: Program }
  | { kind: "section"; item: Section }
  | { kind: "course"; item: CurriculumSubject };

const DELETE_COPY: Record<Deleting["kind"], (name: string) => { title: string; message: string }> = {
  program: (name) => ({
    title: "Delete program?",
    message: `${name} will be removed permanently. Programs that still have students, courses or fee structures can't be deleted.`,
  }),
  section: (name) => ({
    title: "Delete section?",
    message: `Section ${name} will be removed permanently. Sections with students, timetable slots or attendance can't be deleted.`,
  }),
  course: (name) => ({
    title: "Delete course?",
    message: `${name} will be removed permanently. Courses already used in timetables, attendance, marks or exams can't be deleted.`,
  }),
};

export default function CoursesPage() {
  const { user } = useAuth();
  const departments = useDepartments();
  const programs = usePrograms();
  const sections = useSections();
  const curriculum = useCurriculum();
  const deleteProgram = useDeleteProgram();
  const deleteSection = useDeleteSection();
  const deleteSubject = useDeleteSubject();

  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);

  const canCurriculum = canManageCurriculum(user);
  const canSections = canManageSections(user);
  const mayEdit = (departmentId: string) => canManageInDepartment(user, departmentId);

  const depts = useMemo(() => departments.data ?? [], [departments.data]);
  const programList = useMemo(() => programs.data ?? [], [programs.data]);
  const subjects = useMemo(() => curriculum.data ?? [], [curriculum.data]);
  const manageableDepartments = depts.filter((d) => mayEdit(d.id));
  const manageablePrograms = programList.filter((p) => mayEdit(p.departmentId));
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

  const confirmDelete = () => {
    if (!deleting) return;
    const done = { onSuccess: () => toast.success("Deleted."), onSettled: () => setDeleting(null) };
    if (deleting.kind === "program") deleteProgram.mutate(deleting.item.id, done);
    else if (deleting.kind === "section") deleteSection.mutate(deleting.item.id, done);
    else deleteSubject.mutate(deleting.item.id, done);
  };

  const programColumns: Column<Program>[] = [
    {
      header: "Program",
      accessorKey: "name",
      sortable: true,
      cell: (p) => (
        <div>
          <span className="font-medium text-slate-900 block">{p.name}</span>
          <span className="text-xs text-slate-500 font-mono">{p.code}</span>
        </div>
      ),
    },
    { header: "Department", accessorKey: "departmentCode", sortable: true },
    { header: "Level", accessorKey: "degreeType", sortable: true, cell: (p) => DEGREE_LABELS[p.degreeType] ?? p.degreeType },
    {
      header: "Duration",
      accessorKey: "durationYears",
      sortable: true,
      cell: (p) => (
        <span className="font-tabular-nums">
          {p.durationYears} yr · {p.totalSemesters} sem
        </span>
      ),
    },
    {
      header: "Students / Courses",
      accessorKey: "studentCount",
      sortable: true,
      cell: (p) => (
        <span className="font-tabular-nums">
          {p.studentCount} / {p.subjectCount}
        </span>
      ),
    },
    ...(canCurriculum
      ? [
          {
            header: "Actions",
            cell: (p: Program) =>
              mayEdit(p.departmentId) ? (
                <RowActions
                  name={p.name}
                  onEdit={() => setEditing({ kind: "program", item: p })}
                  onDelete={() => setDeleting({ kind: "program", item: p })}
                />
              ) : null,
          },
        ]
      : []),
  ];

  const sectionColumns: Column<Section>[] = [
    { header: "Section", accessorKey: "name", sortable: true, cell: (s) => <span className="font-medium text-slate-900">{s.name}</span> },
    { header: "Semester", accessorKey: "semester", sortable: true, cell: (s) => <span className="font-tabular-nums">{s.semester}</span> },
    { header: "Academic year", accessorKey: "academicYear", sortable: true },
    {
      header: "Enrolled",
      accessorKey: "studentCount",
      sortable: true,
      cell: (s) => (
        <span className="font-tabular-nums">
          {s.studentCount} / {s.capacity}
        </span>
      ),
    },
    ...(canSections
      ? [
          {
            header: "Actions",
            cell: (s: Section) => (
              <RowActions
                name={`section ${s.name}`}
                onEdit={() => setEditing({ kind: "section", item: s })}
                onDelete={() => setDeleting({ kind: "section", item: s })}
              />
            ),
          },
        ]
      : []),
  ];

  const courseColumns: Column<CurriculumSubject>[] = [
    {
      header: "Course",
      accessorKey: "name",
      sortable: true,
      cell: (s) => (
        <div>
          <span className="font-medium text-slate-900 block">{s.name}</span>
          <span className="text-xs text-slate-500 font-mono">{s.code}</span>
        </div>
      ),
    },
    {
      header: "Program",
      accessorKey: "program",
      sortable: true,
      cell: (s) => (
        <span className="text-sm text-slate-700">
          {s.program} · {s.department}
        </span>
      ),
    },
    { header: "Semester", accessorKey: "semester", sortable: true, cell: (s) => <span className="font-tabular-nums">{s.semester}</span> },
    {
      header: "Type",
      accessorKey: "type",
      sortable: true,
      cell: (s) => <Badge variant={s.type === "THEORY" ? "neutral" : "info"}>{SUBJECT_TYPE_LABELS[s.type] ?? s.type}</Badge>,
    },
    { header: "Credits", accessorKey: "credits", sortable: true, cell: (s) => <span className="font-tabular-nums font-semibold">{s.credits}</span> },
    ...(canCurriculum
      ? [
          {
            header: "Actions",
            cell: (s: CurriculumSubject) =>
              mayEdit(s.departmentId) ? (
                <RowActions
                  name={s.code}
                  onEdit={() => setEditing({ kind: "course", item: s })}
                  onDelete={() => setDeleting({ kind: "course", item: s })}
                />
              ) : null,
          },
        ]
      : []),
  ];

  const deleteName = !deleting ? "" : deleting.kind === "course" ? `${deleting.item.code} ${deleting.item.name}` : deleting.item.name;
  const deleteCopy = deleting ? DELETE_COPY[deleting.kind](deleteName) : null;
  const closeEditor = () => setEditing(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Academic Affairs", "Programs & Courses"]}
          title="Programs & Courses"
          description={
            user?.role === "HOD"
              ? "Programs and courses of your department, plus the class sections used across the institute."
              : "Degree programs offered by each department, class sections and the courses that make up the curriculum."
          }
          actions={
            <>
              {canSections && (
                <Button variant="secondary" icon={<PlusCircle className="w-4 h-4" />} onClick={() => setEditing({ kind: "section", item: null })}>
                  Add section
                </Button>
              )}
              {canCurriculum && (
                <>
                  <Button variant="secondary" icon={<PlusCircle className="w-4 h-4" />} onClick={() => setEditing({ kind: "course", item: null })}>
                    Add course
                  </Button>
                  <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => setEditing({ kind: "program", item: null })}>
                    Add program
                  </Button>
                </>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Programs" value={programs.data?.length ?? "—"} icon={<GraduationCap className="w-5 h-5" />} />
          <KpiCard title="Sections" value={sections.data?.length ?? "—"} icon={<Layers className="w-5 h-5" />} />
          <KpiCard title="Courses" value={subjects.length} unit={`${totalCredits} credits`} icon={<BookOpen className="w-5 h-5" />} />
          <KpiCard title="NBA Accredited" value={depts.filter((d) => d.nbaAccredited).length} unit="Depts" icon={<Award className="w-5 h-5" />} />
        </div>

        <section aria-labelledby="programs-heading" className="space-y-3">
          <h2 id="programs-heading" className="text-[15px] font-semibold text-slate-900 font-headline">
            Programs
          </h2>
          {programs.isError ? (
            <ErrorState error={programs.error} onRetry={() => programs.refetch()} />
          ) : (
            <DataTable
              caption="Academic programs"
              data={programList}
              columns={programColumns}
              searchPlaceholder="Search programs…"
              pageSize={10}
              isLoading={programs.isPending}
              emptyMessage="No programs yet"
              emptySubMessage={canCurriculum ? "Add a program before creating student accounts." : "Programs appear here once they are added."}
              exportFileName="jbit-programs"
            />
          )}
        </section>

        <section aria-labelledby="courses-heading" className="space-y-3">
          <h2 id="courses-heading" className="text-[15px] font-semibold text-slate-900 font-headline">
            Courses
          </h2>
          {curriculum.isError ? (
            <ErrorState error={curriculum.error} onRetry={() => curriculum.refetch()} />
          ) : (
            <DataTable
              caption="Courses"
              data={subjects}
              columns={courseColumns}
              searchPlaceholder="Search courses or codes…"
              pageSize={15}
              isLoading={curriculum.isPending}
              emptyMessage="No courses yet"
              emptySubMessage={canCurriculum ? "Add courses to each program semester by semester." : "Courses appear here once they are added."}
              exportFileName="jbit-courses"
            />
          )}
        </section>

        <section aria-labelledby="sections-heading" className="space-y-3">
          <h2 id="sections-heading" className="text-[15px] font-semibold text-slate-900 font-headline">
            Sections
          </h2>
          {sections.isError ? (
            <ErrorState error={sections.error} onRetry={() => sections.refetch()} />
          ) : (
            <DataTable
              caption="Class sections"
              data={sections.data ?? []}
              columns={sectionColumns}
              searchPlaceholder="Search sections…"
              pageSize={10}
              isLoading={sections.isPending}
              emptyMessage="No sections yet"
              emptySubMessage="Sections group students for timetables and attendance."
              exportFileName="jbit-sections"
            />
          )}
        </section>
      </div>

      {/* Keyed by item so each form starts from that item's values. */}
      {editing?.kind === "program" && (
        <ProgramDialog key={editing.item?.id ?? "new"} open onClose={closeEditor} program={editing.item} departments={manageableDepartments} />
      )}
      {editing?.kind === "section" && <SectionDialog key={editing.item?.id ?? "new"} open onClose={closeEditor} section={editing.item} />}
      {editing?.kind === "course" && (
        <CourseDialog key={editing.item?.id ?? "new"} open onClose={closeEditor} course={editing.item} programs={manageablePrograms} />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={deleteCopy?.title ?? ""}
        message={deleteCopy?.message ?? ""}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteProgram.isPending || deleteSection.isPending || deleteSubject.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </DashboardLayout>
  );
}
