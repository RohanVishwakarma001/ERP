"use client";

import Link from "next/link";
import { Bed, BellRing, Briefcase, Building2, Bus, CalendarCheck2, CalendarDays, ChevronRight, Gavel, Sparkles, Users2, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { CardLink, SectionCard } from "@/components/ui/section-card";
import { QueryState } from "@/components/ui/query-state";
import { IconTile, ListRow } from "@/components/ui/list";
import { WelcomePanel } from "@/components/ui/welcome-panel";
import { useAuth } from "@/features/auth";
import { useExecutiveSummary } from "@/features/analytics";
import { useNotices } from "@/features/notices";
import { usePlacementDrives } from "@/features/placement";
import { useExamCycles } from "@/features/exams";
import { useHostels, useTransportRoutes } from "@/features/campus";
import { formatCurrency, formatDate, formatNumber, formatPercent, ratio } from "@/lib/format";

const SHORTCUTS = [
  { href: "/admin/students", title: "Attendance debarment", subtitle: "Ordinance 14(B) reviews", icon: <Gavel /> },
  { href: "/admin/departments", title: "Departments", subtitle: "Headcounts & accreditation", icon: <Building2 /> },
  { href: "/admin/timetable", title: "Timetable", subtitle: "Weekly schedule by section", icon: <CalendarDays /> },
  { href: "/admin/exams", title: "Exams & seating", subtitle: "Cycles, papers & halls", icon: <CalendarCheck2 /> },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const summary = useExecutiveSummary();
  const notices = useNotices();
  const drives = usePlacementDrives();
  const cycles = useExamCycles();
  const routes = useTransportRoutes();
  const hostels = useHostels();

  const s = summary.data;
  const liveDrives = drives.data?.filter((d) => d.status === "LIVE") ?? [];
  const nextCycle = cycles.data?.find((c) => c.startDate && new Date(c.startDate) >= new Date()) ?? cycles.data?.[0];
  const beds = (hostels.data ?? []).reduce((acc, h) => ({ total: acc.total + h.totalBeds, used: acc.used + h.occupiedBeds }), { total: 0, used: 0 });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <WelcomePanel
          eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          title="Administration overview"
          subtitle={
            s
              ? `Welcome, ${user?.name}. ${formatNumber(s.totalEnrolledStudents)} students and ${formatNumber(s.activeFacultyCount)} faculty across ${s.departmentsCount} departments.`
              : `Welcome, ${user?.name}.`
          }
          actions={
            <Link href="/admin/ai-copilot" className={buttonClasses("secondary")}>
              <Sparkles aria-hidden className="w-4 h-4" /> Ask AI Copilot
            </Link>
          }
        />

        <QueryState query={summary}>
          {(s) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                title="Enrolled students"
                value={formatNumber(s.totalEnrolledStudents)}
                icon={<Users2 />}
                footerLeft={`Avg attendance ${formatPercent(s.overallCampusAttendance)}`}
                footerRight={`${formatNumber(s.debarredStudentsCount)} debarred`}
                footerRightColor={s.debarredStudentsCount > 0 ? "warning" : "success"}
              />
              <KpiCard title="Departments" value={s.departmentsCount} icon={<Building2 />} footerLeft={`${formatNumber(s.activeFacultyCount)} faculty members`} />
              <KpiCard
                title="Fee collection"
                value={formatPercent(s.feeCollectionRate)}
                icon={<Wallet />}
                footerLeft={`${formatCurrency(s.totalFeeCollected)} collected`}
                footerRight={`of ${formatCurrency(s.totalFeeBilled)}`}
              />
              <KpiCard
                title="Placement offers"
                value={formatNumber(s.placementOffersCount)}
                icon={<Briefcase />}
                footerLeft={`${liveDrives.length} drive${liveDrives.length === 1 ? "" : "s"} open`}
              />
            </div>
          )}
        </QueryState>

        <section aria-labelledby="shortcuts-heading">
          <h2 id="shortcuts-heading" className="text-[15px] font-semibold text-slate-900 font-headline mb-3">
            Shortcuts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {SHORTCUTS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group p-4 rounded-2xl border border-border-subtle bg-white shadow-xs hover:border-border-strong hover:shadow-sm transition-all flex items-center gap-3"
              >
                <IconTile>{link.icon}</IconTile>
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-900 block">{link.title}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">{link.subtitle}</span>
                </span>
                <ChevronRight aria-hidden className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SectionCard className="lg:col-span-7" title="Latest notices" icon={<BellRing className="w-5 h-5" />} action={<CardLink href="/admin/notices">Manage</CardLink>}>
            <QueryState query={notices} empty={{ title: "No notices published yet", icon: <BellRing /> }}>
              {(list) => (
                <ul className="divide-y divide-border-subtle -mt-1">
                  {list.slice(0, 5).map((n) => (
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

          <SectionCard className="lg:col-span-5" title="Campus operations">
            <div className="-mx-3">
              <ListRow
                href="/admin/exams"
                leading={<IconTile>
                  <CalendarCheck2 />
                </IconTile>}
                title={nextCycle?.name ?? "No exam cycle scheduled"}
                subtitle={nextCycle?.startDate ? `${formatDate(nextCycle.startDate)} – ${formatDate(nextCycle.endDate)} · ${nextCycle.totalPapers} papers` : "—"}
              />
              <ListRow
                href="/admin/transport"
                leading={<IconTile>
                  <Bus />
                </IconTile>}
                title={`${routes.data?.length ?? 0} bus routes`}
                subtitle={`${routes.data?.filter((r) => r.status === "ON_ROUTE").length ?? 0} reporting live GPS · ${formatNumber(routes.data?.reduce((n, r) => n + r.passHolders, 0) ?? 0)} passes`}
              />
              <ListRow
                href="/admin/hostel"
                leading={<IconTile>
                  <Bed />
                </IconTile>}
                title="Hostel occupancy"
                subtitle={beds.total ? `${formatPercent(ratio(beds.used, beds.total))} of ${beds.total} beds · ${hostels.data?.length ?? 0} buildings` : "No hostel data"}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
