"use client";

import { useState } from "react";
import { Building, CalendarCheck2, FileText, PlusCircle, Printer, Trash2, Users2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { SelectInput } from "@/components/ui/form-field";
import { AddPaperDialog, CreateExamDialog } from "@/components/academics/exam-dialogs";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { QueryState } from "@/components/ui/query-state";
import {
  EXAM_STATUSES,
  useDeleteExam,
  useExamCycles,
  useExamSchedule,
  useRemoveExamPaper,
  useSeatingHalls,
  useSetExamStatus,
  type ExamCycle,
  type ExamPaper,
  type ExamStatus,
} from "@/features/exams";
import { useAuth } from "@/features/auth";
import { toast } from "@/lib/toast-store";

/** Mirrors RoleGroups.EXAM_CONTROL on the backend. */
const EXAM_MANAGERS = new Set(["SUPER_ADMIN", "ADMIN", "HOD", "EXAM_OFFICER"]);
import { formatDate, ratio } from "@/lib/format";

export function ExamsScreen() {
  const cycles = useExamCycles();
  const schedule = useExamSchedule();
  const seating = useSeatingHalls();
  const { user } = useAuth();
  const canManage = Boolean(user && EXAM_MANAGERS.has(user.role));
  const setStatus = useSetExamStatus();
  const deleteExam = useDeleteExam();
  const removePaper = useRemoveExamPaper();
  const [creating, setCreating] = useState(false);
  const [addingTo, setAddingTo] = useState<ExamCycle | null>(null);
  const [deletingExam, setDeletingExam] = useState<ExamCycle | null>(null);
  const [removingPaper, setRemovingPaper] = useState<ExamPaper | null>(null);

  const halls = seating.data ?? [];
  const candidates = halls.reduce((n, h) => n + h.candidateCount, 0);
  const invigilators = new Set(halls.flatMap((h) => h.invigilators)).size;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Examination Cell", "COE Console"]}
          title="Examinations & Seating"
          description="Exam cycles, the paper timetable, and hall allocations with invigilators."
          actions={
            <>
              <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
                Print Seating Plan
              </Button>
              {canManage && (
                <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => setCreating(true)}>
                  New exam
                </Button>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Exam Cycles" value={cycles.data?.length ?? "—"} icon={<CalendarCheck2 className="w-5 h-5" />} />
          <KpiCard title="Papers Scheduled" value={schedule.data?.length ?? "—"} icon={<FileText className="w-5 h-5" />} />
          <KpiCard title="Hall Allocations" value={halls.length} unit={`${candidates} seated`} icon={<Building className="w-5 h-5" />} />
          <KpiCard title="Invigilators" value={invigilators} icon={<Users2 className="w-5 h-5" />} />
        </div>

        <SectionCard title="Exam Cycles">
          <QueryState query={cycles} empty={{ title: "No exam cycles defined" }}>
            {(list) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {list.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-border-subtle space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-900">{c.name}</h4>
                      <Badge variant="info">{c.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {c.session} · {c.academicYear}
                    </p>
                    <p className="text-xs text-slate-600">
                      {c.startDate ? `${formatDate(c.startDate)} – ${formatDate(c.endDate)}` : "Dates not set"} · {c.totalPapers} papers •{" "}
                      {c.totalHalls} halls
                    </p>
                    {canManage && (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <Button size="sm" variant="soft" icon={<PlusCircle className="w-4 h-4" />} onClick={() => setAddingTo(c)}>
                          Add paper
                        </Button>
                        <SelectInput
                          aria-label={`Status of ${c.name}`}
                          className="!h-9 !w-auto text-xs"
                          value={c.status}
                          onChange={(e) => setStatus.mutate({ id: c.id, status: e.target.value as ExamStatus })}
                        >
                          {EXAM_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st.charAt(0) + st.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </SelectInput>
                        <IconButton label={`Delete ${c.name}`} onClick={() => setDeletingExam(c)} className="hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </IconButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </QueryState>
        </SectionCard>

        <SectionCard title="Paper Timetable">
          <QueryState query={schedule} empty={{ title: "No papers scheduled" }}>
            {(papers) => (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-slate-500 uppercase text-xs tracking-wider">
                    <tr className="border-b border-border-subtle">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Paper</th>
                      <th className="py-2 pr-3">Max Marks</th>
                      <th className="py-2">Rooms</th>
                      {canManage && <th className="py-2"><span className="sr-only">Actions</span></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((p) => (
                      <tr key={p.id} className="border-b border-surface-subtle last:border-0">
                        <td className="py-2 pr-3 font-semibold text-slate-800">{formatDate(p.date)}</td>
                        <td className="py-2 pr-3 text-slate-600">{p.time}</td>
                        <td className="py-2 pr-3">
                          <span className="font-mono font-semibold text-slate-700">{p.code}</span> {p.subject}
                        </td>
                        <td className="py-2 pr-3 font-tabular-nums">{p.maxMarks}</td>
                        <td className="py-2 text-slate-500">{p.rooms.join(", ") || "Not allocated"}</td>
                        {canManage && (
                          <td className="py-1 text-right">
                            {p.rooms.length === 0 && (
                              <IconButton label={`Remove ${p.code} from ${p.examTitle}`} onClick={() => setRemovingPaper(p)} className="hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" aria-hidden />
                              </IconButton>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </QueryState>
        </SectionCard>

        <SectionCard title="Hall Allocations">
          <QueryState
            query={seating}
            empty={{ title: "No halls allocated yet", description: "Halls appear here once candidates are seated for a paper." }}
          >
            {(list) => (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {list.map((h) => (
                  <div key={h.id} className="p-4 rounded-xl border border-border-subtle bg-white space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900">{h.hallNumber}</h4>
                        <p className="text-xs text-slate-500">
                          {h.block} · {formatDate(h.date)} · {h.shift}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-600">{h.subjectCode}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Seated</span>
                        <span className="font-semibold font-tabular-nums">
                          {h.candidateCount} / {h.capacity}
                        </span>
                      </div>
                      <ProgressBar value={ratio(h.candidateCount, h.capacity) ?? 0} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Invigilators: {h.invigilators.length ? h.invigilators.join(", ") : <span className="text-amber-700">none assigned</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </QueryState>
        </SectionCard>
      </div>

      {creating && <CreateExamDialog onClose={() => setCreating(false)} />}
      {addingTo && <AddPaperDialog key={addingTo.id} exam={addingTo} onClose={() => setAddingTo(null)} />}
      <ConfirmDialog
        open={deletingExam !== null}
        title="Delete exam?"
        message={`${deletingExam?.name ?? ""} and its paper timetable will be removed. Exams with admit cards or hall allocations can't be deleted.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteExam.isPending}
        onConfirm={() =>
          deletingExam &&
          deleteExam.mutate(deletingExam.id, { onSuccess: () => toast.success("Exam deleted."), onSettled: () => setDeletingExam(null) })
        }
        onCancel={() => setDeletingExam(null)}
      />
      <ConfirmDialog
        open={removingPaper !== null}
        title="Remove paper?"
        message={`${removingPaper?.code ?? ""} ${removingPaper?.subject ?? ""} will be removed from ${removingPaper?.examTitle ?? "the exam"}.`}
        confirmLabel="Remove"
        confirmVariant="danger"
        loading={removePaper.isPending}
        onConfirm={() =>
          removingPaper &&
          removePaper.mutate(removingPaper.id, { onSuccess: () => toast.success("Paper removed."), onSettled: () => setRemovingPaper(null) })
        }
        onCancel={() => setRemovingPaper(null)}
      />
    </DashboardLayout>
  );
}
