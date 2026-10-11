"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Award, BookOpen, GraduationCap, Layers, PlusCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field, SelectInput, TextInput } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, QueryState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  DEGREE_TYPES,
  useCreateProgram,
  useCreateSection,
  useCurriculum,
  useDepartments,
  usePrograms,
  useSections,
  type CurriculumSubject,
  type DegreeType,
  type Program,
  type Section,
} from "@/features/departments";
import { useAuth } from "@/features/auth";
import { isAdminRole } from "@/lib/auth/roles";
import { toast } from "@/lib/toast-store";

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

const DEGREE_LABELS: Record<DegreeType, string> = {
  DIPLOMA: "Diploma",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  DOCTORAL: "Doctoral",
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
    header: "Students",
    accessorKey: "studentCount",
    sortable: true,
    cell: (p) => <span className="font-tabular-nums font-semibold">{p.studentCount}</span>,
  },
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
];

/** Indian academic years start in July. */
function currentAcademicYear() {
  const now = new Date();
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

const EMPTY_PROGRAM = { name: "", code: "", departmentId: "", durationYears: "4", totalSemesters: "8", degreeType: "UNDERGRADUATE" as DegreeType };
const emptySection = () => ({ name: "", semester: "1", academicYear: currentAcademicYear(), capacity: "60" });

export default function CoursesPage() {
  const { user } = useAuth();
  const canEdit = isAdminRole(user?.role);
  const departments = useDepartments();
  const curriculum = useCurriculum();
  const programs = usePrograms();
  const sections = useSections();
  const createProgram = useCreateProgram();
  const createSection = useCreateSection();
  const [programOpen, setProgramOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [programForm, setProgramForm] = useState(EMPTY_PROGRAM);
  const [sectionForm, setSectionForm] = useState(emptySection);

  const list = useMemo(() => departments.data ?? [], [departments.data]);
  const subjects = useMemo(() => curriculum.data ?? [], [curriculum.data]);
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

  const submitProgram = (e: FormEvent) => {
    e.preventDefault();
    createProgram.mutate(
      { ...programForm, durationYears: Number(programForm.durationYears), totalSemesters: Number(programForm.totalSemesters) },
      {
        onSuccess: () => {
          toast.success(`${programForm.name} added.`);
          setProgramOpen(false);
          setProgramForm(EMPTY_PROGRAM);
        },
      },
    );
  };

  const submitSection = (e: FormEvent) => {
    e.preventDefault();
    createSection.mutate(
      { ...sectionForm, semester: Number(sectionForm.semester), capacity: Number(sectionForm.capacity) },
      {
        onSuccess: () => {
          toast.success(`Section ${sectionForm.name.trim().toUpperCase()} added.`);
          setSectionOpen(false);
          setSectionForm(emptySection());
        },
      },
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Academic Affairs", "Programs & Courses"]}
          title="Programs & Curriculum"
          description="Degree programs offered by each department, class sections and the subjects that make up the curriculum."
          actions={
            canEdit && (
              <>
                <Button variant="secondary" icon={<PlusCircle className="w-4 h-4" />} onClick={() => setSectionOpen(true)}>
                  Add section
                </Button>
                <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => setProgramOpen(true)}>
                  Add program
                </Button>
              </>
            )
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Programs" value={programs.data?.length ?? "—"} icon={<GraduationCap className="w-5 h-5" />} />
          <KpiCard title="Sections" value={sections.data?.length ?? "—"} icon={<Layers className="w-5 h-5" />} />
          <KpiCard title="Subjects" value={subjects.length} unit={`${totalCredits} credits`} icon={<BookOpen className="w-5 h-5" />} />
          <KpiCard title="NBA Accredited" value={list.filter((d) => d.nbaAccredited).length} unit="Depts" icon={<Award className="w-5 h-5" />} />
        </div>

        <QueryState query={departments} empty={{ title: "No departments yet", description: "Add one under Departments to start." }}>
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

        <section aria-labelledby="programs-heading" className="space-y-3">
          <h2 id="programs-heading" className="text-[15px] font-semibold text-slate-900 font-headline">
            Programs
          </h2>
          {programs.isError ? (
            <ErrorState error={programs.error} onRetry={() => programs.refetch()} />
          ) : (
            <DataTable
              caption="Academic programs"
              data={programs.data ?? []}
              columns={programColumns}
              searchPlaceholder="Search programs…"
              pageSize={10}
              isLoading={programs.isPending}
              emptyMessage="No programs yet"
              emptySubMessage={canEdit ? "Add a program before creating student accounts." : "Programs appear here once an administrator adds them."}
              exportFileName="jbit-programs"
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

      <Modal open={programOpen} onClose={() => setProgramOpen(false)} title="Add program">
        <form onSubmit={submitProgram} className="space-y-4">
          <Field label="Program name">
            <TextInput
              required
              maxLength={160}
              placeholder="e.g. B.Tech Computer Science & Engineering"
              value={programForm.name}
              onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Code" hint="Letters, digits or _, e.g. BTECH_CSE">
              <TextInput
                required
                pattern="[A-Za-z0-9_]{2,20}"
                value={programForm.code}
                onChange={(e) => setProgramForm({ ...programForm, code: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Department">
              <SelectInput required value={programForm.departmentId} onChange={(e) => setProgramForm({ ...programForm, departmentId: e.target.value })}>
                <option value="">{list.length ? "Choose a department" : "Add a department first"}</option>
                {list.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Level">
              <SelectInput value={programForm.degreeType} onChange={(e) => setProgramForm({ ...programForm, degreeType: e.target.value as DegreeType })}>
                {DEGREE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DEGREE_LABELS[t]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Years">
                <TextInput
                  required
                  type="number"
                  min={1}
                  max={6}
                  value={programForm.durationYears}
                  onChange={(e) => setProgramForm({ ...programForm, durationYears: e.target.value })}
                />
              </Field>
              <Field label="Semesters">
                <TextInput
                  required
                  type="number"
                  min={1}
                  max={12}
                  value={programForm.totalSemesters}
                  onChange={(e) => setProgramForm({ ...programForm, totalSemesters: e.target.value })}
                />
              </Field>
            </div>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setProgramOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createProgram.isPending} disabled={!list.length}>
              Save program
            </Button>
          </ModalActions>
        </form>
      </Modal>

      <Modal open={sectionOpen} onClose={() => setSectionOpen(false)} title="Add section">
        <form onSubmit={submitSection} className="space-y-4">
          <Field label="Section name" hint="e.g. CSE-1A">
            <TextInput
              required
              maxLength={30}
              pattern="[A-Za-z0-9][A-Za-z0-9 _\-]{0,29}"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Semester">
              <TextInput
                required
                type="number"
                min={1}
                max={12}
                value={sectionForm.semester}
                onChange={(e) => setSectionForm({ ...sectionForm, semester: e.target.value })}
              />
            </Field>
            <Field label="Academic year">
              <TextInput
                required
                pattern="\d{4}-\d{4}"
                placeholder="2026-2027"
                value={sectionForm.academicYear}
                onChange={(e) => setSectionForm({ ...sectionForm, academicYear: e.target.value })}
              />
            </Field>
            <Field label="Capacity">
              <TextInput
                required
                type="number"
                min={1}
                max={500}
                value={sectionForm.capacity}
                onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
              />
            </Field>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setSectionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createSection.isPending}>
              Save section
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
