"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BellRing, BookOpen, CalendarDays, QrCode, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SectionCard } from "@/components/ui/section-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState, LoadingState, QueryState } from "@/components/ui/query-state";
import { IconTile, ListRow } from "@/components/ui/list";
import { Stat, StatGrid, WelcomePanel } from "@/components/ui/welcome-panel";
import { useMyFacultyProfile, useMyTodayClasses, type TodayClass } from "@/features/faculty";
import { useQrBroadcast, type ClassPeriod } from "@/features/attendance";
import { useNotices } from "@/features/notices";
import { formatDate, ratio } from "@/lib/format";

const STATUS_VARIANT: Record<TodayClass["status"], BadgeVariant> = { LIVE: "success", UPCOMING: "info", COMPLETED: "neutral" };
const STATUS_LABEL: Record<TodayClass["status"], string> = { LIVE: "In session", UPCOMING: "Upcoming", COMPLETED: "Completed" };

export default function FacultyDashboardPage() {
  const profile = useMyFacultyProfile();
  const classes = useMyTodayClasses();
  const [broadcasting, setBroadcasting] = useState<TodayClass | null>(null);

  const liveClass = classes.data?.find((c) => c.status === "LIVE") ?? null;
  const pending = classes.data?.filter((c) => c.status !== "COMPLETED").length ?? 0;
  const f = profile.data;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        {profile.isPending ? (
          <SectionCard>
            <LoadingState rows={2} />
          </SectionCard>
        ) : f ? (
          <WelcomePanel eyebrow={f.department} title={`Hello, ${f.name}`} subtitle={`${f.designation} · ${f.employeeId}`}>
            <StatGrid>
              <Stat label="Classes today" value={classes.data?.length ?? "—"} />
              <Stat label="Still to teach" value={classes.isPending ? "—" : pending} />
              <Stat
                label="Weekly load"
                value={`${f.weeklyWorkloadHours}/${f.maxWorkloadHours} h`}
                note={f.weeklyWorkloadHours < f.maxWorkloadHours ? "Below norm" : "Meets norm"}
                tone={f.weeklyWorkloadHours < f.maxWorkloadHours ? "warning" : "success"}
              />
              <Stat label="Subjects" value={f.assignedSubjects.length} />
            </StatGrid>
          </WelcomePanel>
        ) : (
          <WelcomePanel title="Faculty console" subtitle="We couldn't load your faculty profile." />
        )}

        {liveClass && (
          <section aria-label="Class in session" className="rounded-2xl bg-white border border-emerald-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                <span aria-hidden className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> In session now · Period {liveClass.period} · {liveClass.time}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 font-headline">
                {liveClass.subjectCode}: {liveClass.subjectName}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Room {liveClass.room} · Section {liveClass.section} · {liveClass.markedPresent} of {liveClass.totalStudents} marked present
              </p>
            </div>
            <Button size="lg" icon={<QrCode className="w-5 h-5" />} onClick={() => setBroadcasting(liveClass)}>
              Take attendance
            </Button>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SectionCard className="lg:col-span-8" title="Today's classes" icon={<CalendarDays className="w-5 h-5" />}>
            <QueryState query={classes} empty={{ title: "No classes today", icon: <CalendarDays /> }}>
              {(list) => (
                <div className="-mx-3">
                  {list.map((c) => (
                    <ListRow
                      key={c.id}
                      leading={<IconTile tone={c.status === "LIVE" ? "success" : "brand"}>P{c.period}</IconTile>}
                      title={`${c.subjectCode}: ${c.subjectName}`}
                      subtitle={
                        <span className="flex flex-col gap-1.5">
                          <span>
                            {c.time} · Room {c.room} · Section {c.section}
                          </span>
                          <span className="flex items-center gap-2 max-w-48">
                            <Users aria-hidden className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-tabular-nums shrink-0">
                              {c.markedPresent}/{c.totalStudents}
                            </span>
                            <ProgressBar value={ratio(c.markedPresent, c.totalStudents) ?? 0} tone="success" />
                          </span>
                        </span>
                      }
                      muted={c.status === "COMPLETED"}
                      highlight={c.status === "LIVE"}
                      trailing={
                        <>
                          <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                          {c.status !== "COMPLETED" && (
                            <Button size="sm" variant="soft" icon={<QrCode className="w-4 h-4" />} onClick={() => setBroadcasting(c)} aria-label={`Show attendance QR for ${c.subjectCode}`}>
                              QR
                            </Button>
                          )}
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </QueryState>
          </SectionCard>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <SectionCard title="Assigned subjects" icon={<BookOpen className="w-5 h-5" />}>
              {!f ? (
                <LoadingState rows={2} />
              ) : f.assignedSubjects.length === 0 ? (
                <EmptyState compact title="No subjects assigned" />
              ) : (
                <ul className="space-y-2">
                  {f.assignedSubjects.map((s) => (
                    <li key={`${s.code}-${s.section}`} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="font-medium text-slate-900 block truncate">{s.name}</span>
                        <span className="text-xs text-slate-500">{s.code}</span>
                      </span>
                      <Badge variant="neutral">{s.section}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <FacultyNotices />
          </div>
        </div>
      </div>

      {/* Keyed per class so each broadcast starts with a fresh scan tally. */}
      <QrBroadcastModal key={broadcasting?.id ?? "closed"} classInfo={broadcasting} onClose={() => setBroadcasting(null)} />
    </DashboardLayout>
  );
}

function FacultyNotices() {
  const notices = useNotices();
  return (
    <SectionCard title="Notices" icon={<BellRing className="w-5 h-5" />}>
      <QueryState query={notices} empty={{ title: "No notices right now", icon: <BellRing /> }}>
        {(list) => (
          <ul className="divide-y divide-border-subtle -mt-1">
            {list.slice(0, 3).map((n) => (
              <li key={n.id} className="py-3 first:pt-1">
                <p className="text-sm font-medium text-slate-900">
                  {n.isUrgent && <span className="text-red-700 font-semibold">Urgent · </span>}
                  {n.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(n.publishedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </SectionCard>
  );
}

function QrBroadcastModal({ classInfo, onClose }: { classInfo: TodayClass | null; onClose: () => void }) {
  const period = useMemo<ClassPeriod | null>(
    () => (classInfo ? { subjectCode: classInfo.subjectCode, section: classInfo.section, period: classInfo.period } : null),
    [classInfo],
  );
  const { token, secondsLeft, scannedCount, lastScanner, error } = useQrBroadcast(period, classInfo !== null);

  return (
    <Modal
      open={classInfo !== null}
      onClose={onClose}
      title="Attendance QR"
      description={classInfo ? `${classInfo.subjectCode} · Period ${classInfo.period} · Room ${classInfo.room}` : undefined}
      size="sm"
      footer={
        <Button className="w-full sm:w-auto" onClick={onClose}>
          Done
        </Button>
      }
    >
      {classInfo && (
        <div className="text-center space-y-4">
          <div className="mx-auto w-56 h-56 bg-white p-3 rounded-2xl border border-border-subtle flex items-center justify-center">
            {token ? (
              <QRCodeSVG value={token} size={200} title="Attendance QR code" />
            ) : (
              <QrCode aria-label="Generating QR code" className="w-24 h-24 text-slate-300 animate-pulse" />
            )}
          </div>
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : (
            <p className="text-sm text-slate-500" aria-live="off">
              New code in <span className="font-semibold text-slate-900 font-tabular-nums">{secondsLeft}s</span>
            </p>
          )}
          <div className="pt-4 border-t border-border-subtle" aria-live="polite">
            <p>
              <span className="text-3xl font-semibold text-emerald-700 font-tabular-nums">{scannedCount}</span>
              <span className="text-sm text-slate-500"> scanned this session</span>
            </p>
            {lastScanner && <p className="text-xs text-slate-500 mt-1">Latest: {lastScanner}</p>}
          </div>
        </div>
      )}
    </Modal>
  );
}
