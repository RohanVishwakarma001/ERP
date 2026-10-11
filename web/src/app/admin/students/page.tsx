"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Eye, FileDown, Gavel, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar, TONE_TEXT } from "@/components/ui/progress-bar";
import { SelectInput } from "@/components/ui/form-field";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useStudents, useUpdateDebarment, type DebarmentStatus, type Student } from "@/features/students";
import { ATTENDANCE_THRESHOLD, CONDONATION_FLOOR, attendanceBand, attendanceTone } from "@/features/attendance";
import { formatPercent, initials, ratio } from "@/lib/format";
import { toast } from "@/lib/toast-store";

type Filter = "ALL" | "ELIGIBLE" | "CONDONATION" | "DEBARRED";

function matchesFilter(s: Student, filter: Filter) {
  if (filter === "ALL") return true;
  if (filter === "CONDONATION") return attendanceBand(s.attendancePercent) === "condonation";
  return s.debarmentStatus === filter;
}

export default function StudentRosterPage() {
  const students = useStudents();
  const updateDebarment = useUpdateDebarment();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [reviewing, setReviewing] = useState<Student | null>(null);
  const [confirmingDebar, setConfirmingDebar] = useState(false);

  const list = useMemo(() => students.data ?? [], [students.data]);
  const counts = useMemo(
    () => ({
      safe: list.filter((s) => attendanceBand(s.attendancePercent) === "safe").length,
      condonation: list.filter((s) => attendanceBand(s.attendancePercent) === "condonation").length,
      debarred: list.filter((s) => s.isDebarred).length,
    }),
    [list],
  );

  const decide = (student: Student, status: DebarmentStatus) =>
    updateDebarment.mutate(
      { studentId: student.id, status },
      {
        onSuccess: () => {
          toast.success(status === "DEBARRED" ? `${student.name} debarred; hall ticket withheld.` : `Condonation approved for ${student.name}.`);
          setConfirmingDebar(false);
          setReviewing(null);
        },
      },
    );

  const columns: Column<Student>[] = [
    {
      header: "Student",
      accessorKey: "name",
      sortable: true,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-semibold text-xs shrink-0">
            {initials(s.name)}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block leading-tight">{s.name}</span>
            <span className="text-xs text-slate-500 font-mono">#{s.rollNumber}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Program / Section",
      accessorKey: "program",
      sortable: true,
      cell: (s) => (
        <div>
          <span className="font-medium text-slate-800 block leading-tight">{s.program}</span>
          <span className="text-xs text-slate-500">
            Sem {s.semester} · {s.section ?? "No section"}
          </span>
        </div>
      ),
    },
    {
      header: "Attendance",
      accessorKey: "attendancePercent",
      sortable: true,
      cell: (s) => (
        <div className="w-28">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-semibold font-tabular-nums text-sm ${TONE_TEXT[attendanceTone(s.attendancePercent)]}`}>
              {formatPercent(s.attendancePercent)}
            </span>
            <span className="text-xs text-slate-400">
              ({s.attendedClasses}/{s.conductedClasses})
            </span>
          </div>
          <ProgressBar value={s.attendancePercent} tone={attendanceTone(s.attendancePercent)} className="mt-1" />
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "debarmentStatus",
      sortable: true,
      cell: (s) =>
        s.isDebarred ? (
          <Badge variant="error">Debarred · hall ticket withheld</Badge>
        ) : attendanceBand(s.attendancePercent) === "condonation" ? (
          <Badge variant="warning">Condoned</Badge>
        ) : (
          <Badge variant="success">Eligible</Badge>
        ),
    },
    {
      header: "",
      cell: (s) => (
        <Button size="sm" variant="secondary" icon={<Eye className="w-4 h-4" />} onClick={() => setReviewing(s)} aria-label={`Review debarment for ${s.name}`}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Academic Affairs", "Students", "Debarment Registry"]}
          title="Student Roster & Debarment Registry"
          badge={
            <Badge variant="primary">
              <Gavel className="w-3.5 h-3.5" /> Ordinance 14(B)
            </Badge>
          }
          description={`Students below ${ATTENDANCE_THRESHOLD}% attendance are debarred and their hall tickets withheld. Between ${CONDONATION_FLOOR}% and ${ATTENDANCE_THRESHOLD}%, the Dean may approve condonation on a valid medical or on-duty certificate.`}
          actions={
            <Button variant="secondary" icon={<FileDown className="w-4 h-4" />} onClick={() => window.print()}>
              Print Roster
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Enrolled" value={list.length} unit="Students" icon={<Users className="w-5 h-5" />} />
          <KpiCard
            title={`At or above ${ATTENDANCE_THRESHOLD}%`}
            value={counts.safe}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
            footerLeft={`${formatPercent(ratio(counts.safe, list.length))} of cohort`}
            footerRightColor="success"
          />
          <KpiCard
            title={`${CONDONATION_FLOOR}–${ATTENDANCE_THRESHOLD}% (condonable)`}
            value={counts.condonation}
            icon={<AlertTriangle className="w-5 h-5 text-amber-700" />}
            footerLeft="Eligible for review"
            footerRightColor="warning"
          />
          <KpiCard
            title="Debarred"
            value={counts.debarred}
            icon={<Ban className="w-5 h-5 text-red-700" />}
            footerLeft="Hall tickets withheld"
            footerRightColor="error"
          />
        </div>

        {students.isError ? (
          <ErrorState error={students.error} onRetry={() => students.refetch()} />
        ) : (
          <DataTable
            data={list.filter((s) => matchesFilter(s, filter))}
            columns={columns}
            searchPlaceholder="Search by name…"
            searchKey="name"
            pageSize={10}
            isLoading={students.isPending}
            exportFileName="jbit-student-debarment-roster"
            filterComponent={
              <SelectInput aria-label="Filter by attendance status" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="sm:w-56">
                <option value="ALL">All students</option>
                <option value="ELIGIBLE">Eligible</option>
                <option value="CONDONATION">{`${CONDONATION_FLOOR}–${ATTENDANCE_THRESHOLD}% band`}</option>
                <option value="DEBARRED">Debarred</option>
              </SelectInput>
            }
          />
        )}
      </div>

      <Modal
        open={reviewing !== null}
        onClose={() => setReviewing(null)}
        title="Debarment Review"
        icon={<Gavel className="w-5 h-5 text-primary-container" />}
        size="lg"
      >
        {reviewing && (
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-border-subtle">
              <p className="font-semibold text-sm text-slate-900">{reviewing.name}</p>
              <p className="text-slate-500 font-mono">
                #{reviewing.rollNumber} · {reviewing.program}
              </p>
              <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200">
                <span>Attendance</span>
                <span className="font-semibold text-sm text-slate-900 font-tabular-nums">
                  {formatPercent(reviewing.attendancePercent)} ({reviewing.attendedClasses}/{reviewing.conductedClasses} classes)
                </span>
              </div>
              {reviewing.pendingAttendancePetitions > 0 && (
                <p className="mt-2 text-amber-700">{reviewing.pendingAttendancePetitions} attendance petition(s) pending review.</p>
              )}
            </div>
            {attendanceBand(reviewing.attendancePercent) === "critical" && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800">
                Attendance is below {CONDONATION_FLOOR}%; condonation is not permitted under Ordinance 14(B).
              </div>
            )}
            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <Button variant="danger" disabled={updateDebarment.isPending} onClick={() => setConfirmingDebar(true)}>
                Debar & withhold hall ticket
              </Button>
              <Button
                variant="success"
                loading={updateDebarment.isPending && !confirmingDebar}
                disabled={attendanceBand(reviewing.attendancePercent) === "critical"}
                onClick={() => decide(reviewing, "ELIGIBLE")}
              >
                Approve & release hall ticket
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmingDebar && reviewing !== null}
        title="Debar this student?"
        confirmLabel="Debar student"
        confirmVariant="danger"
        loading={updateDebarment.isPending}
        onCancel={() => setConfirmingDebar(false)}
        onConfirm={() => reviewing && decide(reviewing, "DEBARRED")}
        message={
          reviewing && (
            <>
              <strong className="font-semibold text-slate-900">{reviewing.name}</strong> ({reviewing.rollNumber}) will be marked debarred and their end-term hall
              ticket withheld. This can be reversed later by approving condonation.
            </>
          )
        }
      />
    </DashboardLayout>
  );
}
