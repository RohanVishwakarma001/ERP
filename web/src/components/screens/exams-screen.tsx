"use client";

import { Building, CalendarCheck2, FileText, Printer, Users2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { QueryState } from "@/components/ui/query-state";
import { useExamCycles, useExamSchedule, useSeatingHalls } from "@/features/exams";
import { formatDate, ratio } from "@/lib/format";

export function ExamsScreen() {
  const cycles = useExamCycles();
  const schedule = useExamSchedule();
  const seating = useSeatingHalls();

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
            <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Print Seating Plan
            </Button>
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
            empty={{ title: "No halls allocated yet", description: "Seat candidates for a paper via POST /exams/seating-matrix/generate." }}
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
    </DashboardLayout>
  );
}
