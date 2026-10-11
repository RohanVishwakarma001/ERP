"use client";

import { CalendarCheck2, Download, FileBadge, Hourglass, ShieldAlert } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard, CardLink } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/ui/query-state";
import { useDownloadAdmitCard, useMyExams, type MyExams } from "@/features/admit-cards";
import { useAuth } from "@/features/auth";
import { formatCurrency, formatDate } from "@/lib/format";

type Exam = MyExams["exams"][number];

function AdmitCardStatus({ exam, fees, isDebarred }: { exam: Exam; fees: MyExams["fees"]; isDebarred: boolean }) {
  const { user } = useAuth();
  const download = useDownloadAdmitCard();
  const card = exam.admitCard;

  if (card?.status === "APPROVED") {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-emerald-50">
        <FileBadge aria-hidden className="w-5 h-5 text-emerald-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900">Admit card approved</p>
          <p className="text-xs text-emerald-800">
            Card {card.cardNumber} · approved {formatDate(card.approvedAt)}
          </p>
        </div>
        <Button
          icon={<Download className="w-4 h-4" />}
          loading={download.isPending && download.variables?.id === card.id}
          onClick={() => download.mutate({ id: card.id, rollNumber: `admit-card-${user?.rollNumber ?? exam.cycle}` })}
        >
          Download PDF
        </Button>
      </div>
    );
  }

  if (card?.status === "REVOKED") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50">
        <ShieldAlert aria-hidden className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-900">Admit card revoked</p>
          <p className="text-xs text-red-800">{card.remarks ?? "Contact the examination cell."}</p>
        </div>
      </div>
    );
  }

  // Not reviewed yet: tell the student what the administrator will check.
  const issues = [
    !fees.cleared && `clear your outstanding fees of ${formatCurrency(fees.pending)}`,
    isDebarred && "your attendance is below 75% (debarred)",
  ].filter(Boolean) as string[];
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50">
      <Hourglass aria-hidden className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-amber-900">Awaiting approval</p>
        <p className="text-xs text-amber-900">
          The administration approves admit cards after verifying fees and attendance.
          {issues.length > 0 ? ` Before it can be approved: ${issues.join("; ")}.` : " Your fees are cleared, so no action is needed from you."}
        </p>
        {!fees.cleared && (
          <div className="mt-2">
            <CardLink href="/student/fees">Pay fees</CardLink>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentExamsPage() {
  const exams = useMyExams();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <PageHeader title="Exams & admit card" description="Your exam timetable and admit card. Download the card once the administration approves it." />
        <QueryState
          query={exams}
          isEmpty={(d) => d.exams.length === 0}
          empty={{ title: "No exams scheduled", description: "Exams with papers for your program and semester will appear here.", icon: <CalendarCheck2 /> }}
        >
          {(d) => (
            <div className="flex flex-col gap-6">
              {d.exams.map((exam) => (
                <SectionCard
                  key={exam.examId}
                  title={exam.title}
                  subtitle={`${exam.cycle} · ${exam.academicYear}`}
                  action={<Badge variant={exam.status === "COMPLETED" ? "neutral" : "info"}>{exam.status.toLowerCase()}</Badge>}
                >
                  <div className="flex flex-col gap-4">
                    <AdmitCardStatus exam={exam} fees={d.fees} isDebarred={d.isDebarred} />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <caption className="sr-only">Papers in {exam.title}</caption>
                        <thead className="text-left text-xs text-slate-500">
                          <tr className="border-b border-border-subtle">
                            <th scope="col" className="py-2 pr-3 font-medium">Date</th>
                            <th scope="col" className="py-2 pr-3 font-medium">Time</th>
                            <th scope="col" className="py-2 font-medium">Paper</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.papers.map((p) => (
                            <tr key={p.id} className="border-b border-surface-subtle last:border-0">
                              <td className="py-2.5 pr-3 font-medium text-slate-900 whitespace-nowrap">{formatDate(p.date)}</td>
                              <td className="py-2.5 pr-3 text-slate-600 whitespace-nowrap">
                                {p.startTime} – {p.endTime}
                              </td>
                              <td className="py-2.5">
                                <span className="font-mono text-xs font-semibold text-slate-700">{p.code}</span> {p.name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </QueryState>
      </div>
    </DashboardLayout>
  );
}
