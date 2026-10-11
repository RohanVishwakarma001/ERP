"use client";

import { useState, type FormEvent } from "react";
import { Award, Building2, GraduationCap, PlusCircle, Printer, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Field, TextInput } from "@/components/ui/form-field";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useCreateDepartment, useDepartments, type Department } from "@/features/departments";
import { attendanceTone } from "@/features/attendance";
import { formatNumber, formatPercent } from "@/lib/format";
import { toast } from "@/lib/toast-store";

const EMPTY_FORM = { name: "", code: "", building: "" };

const columns: Column<Department>[] = [
  {
    header: "Department",
    accessorKey: "name",
    sortable: true,
    cell: (d) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-8 rounded-lg bg-surface-container-low text-primary-container font-semibold text-xs flex items-center justify-center shrink-0">
          {d.code}
        </div>
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">{d.name}</span>
          <span className="text-xs text-slate-500">{d.programs.join(", ") || "No programs"}</span>
        </div>
      </div>
    ),
  },
  {
    header: "HOD",
    accessorKey: "hodName",
    sortable: true,
    cell: (d) =>
      d.hodName ? (
        <div>
          <span className="font-medium text-slate-800 block leading-tight">{d.hodName}</span>
          <span className="text-xs text-slate-400 font-mono">{d.hodEmail}</span>
        </div>
      ) : (
        <span className="text-xs text-slate-400">Not assigned</span>
      ),
  },
  {
    header: "Students",
    accessorKey: "studentCount",
    sortable: true,
    cell: (d) => <span className="font-semibold text-slate-800 font-tabular-nums">{formatNumber(d.studentCount)}</span>,
  },
  {
    header: "Faculty",
    accessorKey: "facultyCount",
    sortable: true,
    cell: (d) => (
      <div>
        <span className="font-semibold text-slate-800 font-tabular-nums">{d.facultyCount}</span>
        {d.fsrRatio && <span className="text-xs text-slate-500 block">FSR {d.fsrRatio}</span>}
      </div>
    ),
  },
  {
    header: "Accreditation",
    accessorKey: "nbaAccredited",
    sortable: true,
    cell: (d) => <Badge variant={d.nbaAccredited ? "success" : "neutral"}>{d.accreditationStatus}</Badge>,
  },
  {
    header: "Avg Attendance",
    accessorKey: "averageAttendance",
    sortable: true,
    cell: (d) =>
      d.averageAttendance == null ? (
        <span className="text-xs text-slate-400">—</span>
      ) : (
        <div className="flex items-center gap-2 w-28">
          <ProgressBar value={d.averageAttendance} tone={attendanceTone(d.averageAttendance)} />
          <span className="font-semibold text-xs text-slate-700 font-tabular-nums">{formatPercent(d.averageAttendance)}</span>
        </div>
      ),
  },
];

export default function DepartmentsPage() {
  const departments = useDepartments();
  const createDepartment = useCreateDepartment();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const list = departments.data ?? [];
  const totals = list.reduce(
    (acc, d) => ({ students: acc.students + d.studentCount, faculty: acc.faculty + d.facultyCount, nba: acc.nba + Number(d.nbaAccredited) }),
    { students: 0, faculty: 0, nba: 0 },
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createDepartment.mutate(form, {
      onSuccess: (dept) => {
        toast.success(`${dept.name} created.`);
        setIsAddOpen(false);
        setForm(EMPTY_FORM);
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Academic Affairs", "Departments"]}
          title="Departments"
          description="Academic departments with headcounts, leadership, accreditation and attendance."
          actions={
            <>
              <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                Print
              </Button>
              <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => setIsAddOpen(true)}>
                Add Department
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Departments" value={list.length} icon={<Building2 className="w-5 h-5" />} />
          <KpiCard title="Students" value={formatNumber(totals.students)} icon={<Users className="w-5 h-5" />} />
          <KpiCard
            title="Faculty"
            value={formatNumber(totals.faculty)}
            icon={<GraduationCap className="w-5 h-5" />}
            footerLeft={totals.faculty ? `FSR 1:${(totals.students / totals.faculty).toFixed(1)}` : undefined}
            footerRightColor="info"
          />
          <KpiCard title="NBA Accredited" value={totals.nba} unit={`of ${list.length}`} icon={<Award className="w-5 h-5" />} />
        </div>

        {departments.isError ? (
          <ErrorState error={departments.error} onRetry={() => departments.refetch()} />
        ) : (
          <DataTable
            data={list}
            columns={columns}
            searchPlaceholder="Search departments…"
            pageSize={10}
            isLoading={departments.isPending}
            exportFileName="jbit-departments"
          />
        )}
      </div>

      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Department">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Department name">
            <TextInput
              required
              placeholder="e.g. Artificial Intelligence & Data Science"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Code" hint="2–10 letters or digits, e.g. AIDS">
            <TextInput
              required
              pattern="[A-Za-z0-9]{2,10}"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Building">
            <TextInput required placeholder="e.g. Block A" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
          </Field>
          <ModalActions>
            <Button variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createDepartment.isPending}>
              Save Department
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
