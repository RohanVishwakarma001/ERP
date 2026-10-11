"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, Bot, Briefcase, Bus, CalendarCheck2, CalendarDays, CreditCard, GraduationCap, QrCode, Send } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { CardLink, SectionCard } from "@/components/ui/section-card";
import { ProgressBar, TONE_TEXT } from "@/components/ui/progress-bar";
import { EmptyState, LoadingState, QueryState } from "@/components/ui/query-state";
import { IconTile, ListRow } from "@/components/ui/list";
import { Stat, StatGrid, WelcomePanel } from "@/components/ui/welcome-panel";
import { useMyStudentProfile } from "@/features/students";
import { ATTENDANCE_THRESHOLD, attendanceTone, useMySubjectAttendance } from "@/features/attendance";
import { todayDayCode, useMyTimetable } from "@/features/timetable";
import { useApplyToDrive, usePlacementApplications, usePlacementDrives, useSignLoi } from "@/features/placement";
import { useMyBusPass } from "@/features/campus";
import { useExamSchedule, useMyGradeCard } from "@/features/exams";
import { useNotices } from "@/features/notices";
import { useAskCopilot } from "@/features/ai";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { toast } from "@/lib/toast-store";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function StudentDashboardPage() {
  const profile = useMyStudentProfile();
  const timetable = useMyTimetable();
  const today = todayDayCode();
  const todaysClasses = (timetable.data ?? []).filter((s) => s.dayOfWeek === today);
  const s = profile.data;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        {profile.isPending ? (
          <SectionCard>
            <LoadingState label="Loading your profile…" rows={2} />
          </SectionCard>
        ) : profile.isError || !s ? (
          <WelcomePanel title={greeting()} subtitle="We couldn't load your student profile. Some sections below may be unavailable." />
        ) : (
          <WelcomePanel
            eyebrow={`${s.program} · Semester ${s.semester}${s.section ? ` · Section ${s.section}` : ""}`}
            title={`${greeting()}, ${s.name.split(" ")[0]}`}
            subtitle={`Roll number ${s.rollNumber}`}
            actions={
              <>
                <Link href="/student/attendance" className={buttonClasses("primary")}>
                  <QrCode aria-hidden className="w-4 h-4" /> Scan attendance
                </Link>
                <Link href="/student/fees" className={buttonClasses("secondary")}>
                  <CreditCard aria-hidden className="w-4 h-4" /> Fees
                </Link>
              </>
            }
          >
            <StatGrid>
              <Stat label="CGPA" value={s.cgpa.toFixed(2)} />
              <Stat
                label="Attendance"
                value={formatPercent(s.attendancePercent)}
                note={s.isDebarred ? "Debarred" : s.attendancePercent >= ATTENDANCE_THRESHOLD ? "On track" : `Below ${ATTENDANCE_THRESHOLD}%`}
                tone={s.isDebarred ? "error" : s.attendancePercent >= ATTENDANCE_THRESHOLD ? "success" : "warning"}
                href="/student/attendance"
              />
              <Stat
                label="Fee dues"
                value={s.feesDue > 0 ? formatCurrency(s.feesDue) : "None"}
                note={s.feesDue > 0 ? "Pending" : "Cleared"}
                tone={s.feesDue > 0 ? "warning" : "success"}
                href="/student/fees"
              />
              <Stat label="Classes today" value={timetable.isPending ? "—" : todaysClasses.length} />
            </StatGrid>
          </WelcomePanel>
        )}

        {s?.isDebarred && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle aria-hidden className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-semibold">Hall ticket withheld</p>
              <p className="mt-0.5 text-red-800">
                Your attendance is below {ATTENDANCE_THRESHOLD}% (UTU Ordinance 14(B)). If you have a valid medical or on-duty certificate,{" "}
                <Link href="/student/attendance" className="font-semibold underline underline-offset-2">
                  file a correction petition
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SectionCard className="lg:col-span-7" title="Today's classes" icon={<CalendarDays className="w-5 h-5" />} subtitle={today ? undefined : "No classes on Sunday"}>
            <QueryState query={timetable}>
              {() =>
                todaysClasses.length === 0 ? (
                  <EmptyState compact icon={<CalendarDays />} title="No classes scheduled today" />
                ) : (
                  <div className="-mx-3">
                    {todaysClasses.map((c) => (
                      <ListRow
                        key={c.id}
                        leading={<IconTile tone={c.status === "LIVE" ? "success" : "brand"}>P{c.period}</IconTile>}
                        title={c.subjectName}
                        subtitle={`${c.subjectCode} · ${c.facultyName} · Room ${c.roomNumber}`}
                        trailing={
                          <>
                            {c.status === "LIVE" && <Badge variant="success" pulse>Now</Badge>}
                            <span className="text-xs text-slate-500 font-tabular-nums">{c.time}</span>
                          </>
                        }
                        highlight={c.status === "LIVE"}
                        muted={c.status === "COMPLETED"}
                      />
                    ))}
                  </div>
                )
              }
            </QueryState>
          </SectionCard>

          <SubjectAttendanceCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingExamsCard />
          <LatestResultCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <NoticesCard className="lg:col-span-7" />
          <div className="lg:col-span-5 flex flex-col gap-6">
            <BusPassCard />
            <QuickAsk />
          </div>
        </div>

        <PlacementPanel />
      </div>
    </DashboardLayout>
  );
}

function SubjectAttendanceCard() {
  const attendance = useMySubjectAttendance();
  return (
    <SectionCard className="lg:col-span-5" title="Subject attendance" icon={<CalendarCheck2 className="w-5 h-5" />} action={<CardLink href="/student/attendance">Details</CardLink>}>
      <QueryState query={attendance} empty={{ title: "No attendance recorded yet" }}>
        {(subjects) => (
          <ul className="space-y-4">
            {subjects.map((a) => (
              <li key={a.subjectCode} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-800 truncate">{a.subjectName}</span>
                  <span className={`font-semibold font-tabular-nums ${TONE_TEXT[attendanceTone(a.percentage)]}`}>{formatPercent(a.percentage)}</span>
                </div>
                <ProgressBar value={a.percentage} tone={attendanceTone(a.percentage)} />
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </SectionCard>
  );
}

function UpcomingExamsCard() {
  const schedule = useExamSchedule();
  const todayIso = new Date().toISOString().slice(0, 10);
  return (
    <SectionCard title="Upcoming exams" icon={<CalendarCheck2 className="w-5 h-5" />}>
      <QueryState query={schedule}>
        {(papers) => {
          const upcoming = papers.filter((p) => p.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
          return upcoming.length === 0 ? (
            <EmptyState compact icon={<CalendarCheck2 />} title="No upcoming exams" description="Scheduled papers will appear here." />
          ) : (
            <div className="-mx-3">
              {upcoming.map((p) => (
                <ListRow
                  key={p.id}
                  leading={
                    <div aria-hidden className="w-11 h-11 rounded-xl bg-surface-container-low text-primary-container flex flex-col items-center justify-center shrink-0 leading-none">
                      <span className="text-[11px] font-semibold uppercase">{new Date(p.date).toLocaleDateString("en-IN", { month: "short" })}</span>
                      <span className="text-base font-semibold font-tabular-nums">{new Date(p.date).getDate()}</span>
                    </div>
                  }
                  title={p.subject}
                  subtitle={`${p.code} · ${p.examTitle} · ${p.time}`}
                  trailing={<Badge variant="neutral">{p.type}</Badge>}
                />
              ))}
            </div>
          );
        }}
      </QueryState>
    </SectionCard>
  );
}

function LatestResultCard() {
  const card = useMyGradeCard();
  return (
    <SectionCard title="Latest result" icon={<GraduationCap className="w-5 h-5" />}>
      {card.isPending ? (
        <LoadingState rows={2} />
      ) : card.isError || !card.data ? (
        // No published result is a normal state for new students, not an error to alarm about.
        <EmptyState compact icon={<GraduationCap />} title="No published results yet" description="Your grade card will appear here once results are declared." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Semester {card.data.semester}
                {card.data.academicYear ? ` · ${card.data.academicYear}` : ""}
              </p>
              <p className="text-xs text-slate-500">{card.data.publishedAt ? `Published ${formatDate(card.data.publishedAt)}` : card.data.resultStatus}</p>
            </div>
            <Badge variant={card.data.backlogs > 0 ? "warning" : "success"}>
              {card.data.backlogs > 0 ? `${card.data.backlogs} backlog${card.data.backlogs > 1 ? "s" : ""}` : "All clear"}
            </Badge>
          </div>
          <StatGrid columns={3}>
            <Stat label="SGPA" value={card.data.sgpa?.toFixed(2) ?? "—"} />
            <Stat label="CGPA" value={card.data.cgpa.toFixed(2)} />
            <Stat label="Credits" value={card.data.totalCreditsEarned} />
          </StatGrid>
        </div>
      )}
    </SectionCard>
  );
}

function NoticesCard({ className }: { className?: string }) {
  const notices = useNotices();
  return (
    <SectionCard className={className} title="Notices" icon={<BellRing className="w-5 h-5" />}>
      <QueryState query={notices} empty={{ title: "No notices right now", icon: <BellRing /> }}>
        {(list) => (
          <ul className="divide-y divide-border-subtle -mt-1">
            {list.slice(0, 4).map((n) => (
              <li key={n.id} className="py-3 first:pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {n.isUrgent && <Badge variant="error">Urgent</Badge>}
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.summary}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {n.authorName} · {formatDate(n.publishedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </SectionCard>
  );
}

function BusPassCard() {
  const busPass = useMyBusPass();
  // No pass is common (day scholars who don't use the bus): show nothing rather than an error.
  if (!busPass.data) return null;
  const p = busPass.data;
  return (
    <SectionCard title="Bus pass" icon={<Bus className="w-5 h-5" />} action={<Badge variant={p.isValid ? "success" : "error"}>{p.isValid ? "Valid" : "Expired"}</Badge>}>
      <p className="text-sm font-medium text-slate-900">
        {p.routeNumber}: {p.routeTitle}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Bus {p.busNumber} · Departs {p.departureTime} · Your stop: {p.designatedStop}
      </p>
    </SectionCard>
  );
}

/** Open drives the student can apply to, plus offers awaiting their LOI signature. */
function PlacementPanel() {
  const drives = usePlacementDrives();
  const applications = usePlacementApplications();
  const apply = useApplyToDrive();
  const signLoi = useSignLoi();

  const openDrives = (drives.data ?? []).filter((d) => d.status === "LIVE");
  const offers = (applications.data ?? []).filter((a) => a.status === "OFFERED");

  return (
    <SectionCard title="Placements" icon={<Briefcase className="w-5 h-5" />}>
      <QueryState query={drives}>
        {() =>
          openDrives.length === 0 && offers.length === 0 ? (
            <EmptyState compact icon={<Briefcase />} title="No open drives right now" />
          ) : (
            <div className="-mx-3">
              {offers.map((o) => (
                <ListRow
                  key={o.id}
                  highlight
                  leading={<IconTile tone="success">
                    <Briefcase />
                  </IconTile>}
                  title={`Offer from ${o.companyName} — ${o.offerCtc ?? o.roleTitle}`}
                  subtitle={o.loiSigned ? `LOI signed ${formatDate(o.loiSignedAt)}` : "Review and sign your Letter of Intent."}
                  trailing={
                    !o.loiSigned && (
                      <Button
                        size="sm"
                        loading={signLoi.isPending && signLoi.variables === o.id}
                        onClick={() => signLoi.mutate(o.id, { onSuccess: () => toast.success(`LOI for ${o.companyName} signed.`) })}
                      >
                        Sign LOI
                      </Button>
                    )
                  }
                />
              ))}
              {openDrives.map((d) => (
                <ListRow
                  key={d.id}
                  leading={<IconTile>
                    <Briefcase />
                  </IconTile>}
                  title={`${d.companyName} — ${d.roleTitle}`}
                  subtitle={`${d.ctc} · CGPA ≥ ${d.minCgpa} · Closes ${formatDate(d.deadline)}`}
                  trailing={
                    d.myApplicationStatus ? (
                      <Badge variant="info">{d.myApplicationStatus.replace("_", " ")}</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="soft"
                        loading={apply.isPending && apply.variables === d.id}
                        onClick={() => apply.mutate(d.id, { onSuccess: (res) => toast.success(res.message) })}
                      >
                        Apply
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          )
        }
      </QueryState>
    </SectionCard>
  );
}

function QuickAsk() {
  const ask = useAskCopilot();
  const [input, setInput] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) ask.mutate(input.trim());
  };

  return (
    <SectionCard title="Ask the campus assistant" icon={<Bot className="w-5 h-5" />} subtitle="Answers come from your own records">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <label htmlFor="quick-ask" className="sr-only">
          Your question
        </label>
        <input
          id="quick-ask"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="e.g. How many classes can I miss?"
          className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-border-strong text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/10"
        />
        <Button type="submit" loading={ask.isPending} disabled={!input.trim()} icon={<Send className="w-4 h-4" />} aria-label="Ask">
          <span className="hidden sm:inline">Ask</span>
        </Button>
      </form>
      {(ask.data || ask.isError) && (
        <p
          aria-live="polite"
          className={`mt-3 p-3 rounded-xl text-sm leading-relaxed ${ask.isError ? "bg-red-50 text-red-800" : "bg-slate-50 text-slate-700"}`}
        >
          {ask.isError ? getErrorMessage(ask.error) : ask.data?.answer}
        </p>
      )}
    </SectionCard>
  );
}
