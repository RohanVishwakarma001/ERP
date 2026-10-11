"use client";

import Link from "next/link";
import { AlertTriangle, ClipboardList, GraduationCap, Users2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { QueryState } from "@/components/ui/query-state";
import { useDepartmentSummary } from "@/features/analytics";
import { useDepartments } from "@/features/departments";
import { useFacultyList, useMyFacultyProfile } from "@/features/faculty";
import { ATTENDANCE_THRESHOLD } from "@/features/attendance";
import { formatPercent, initials } from "@/lib/format";

const SHORTCUTS = [
  { href: "/admin/departments", title: "Departments", subtitle: "Headcounts, accreditation and programs" },
  { href: "/admin/faculty", title: "Faculty Workload", subtitle: "Contact hours against the AICTE norm" },
];

export default function HodDashboardPage() {
  const me = useMyFacultyProfile();
  const departments = useDepartments();
  const faculty = useFacultyList();

  const myDepartment = departments.data?.find((d) => d.name === me.data?.department);
  const summary = useDepartmentSummary(myDepartment?.code);
  const colleagues = (faculty.data ?? []).filter((f) => f.department === me.data?.department);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Department Leadership", "HOD Console"]}
          title={me.data?.department ?? "Department Overview"}
          badge={myDepartment?.nbaAccredited ? <Badge variant="success">NBA Accredited</Badge> : undefined}
          description="Department headcounts, attendance risk, pending approvals and faculty workload."
        />

        <QueryState query={summary} loadingLabel="Loading department summary…">
          {(s) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                title="Students"
                value={s.totalStudents}
                icon={<Users2 className="w-5 h-5" />}
                footerLeft={`Avg attendance ${formatPercent(s.averageAttendance)}`}
              />
              <KpiCard title="Faculty" value={s.totalFaculty} icon={<GraduationCap className="w-5 h-5" />} />
              <KpiCard
                title={`Below ${ATTENDANCE_THRESHOLD}%`}
                value={s.lowAttendanceCount}
                icon={<AlertTriangle className="w-5 h-5 text-amber-700" />}
                footerLeft={`${s.pendingCorrectionPetitions} petitions pending`}
                footerRightColor="warning"
              />
              <KpiCard title="Leave Requests" value={s.pendingLeaveRequests} unit="pending" icon={<ClipboardList className="w-5 h-5" />} />
            </div>
          )}
        </QueryState>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SectionCard className="lg:col-span-8" title="Faculty Workload">
            <QueryState query={faculty} empty={{ title: "No faculty found" }}>
              {() => (
                <div className="space-y-3">
                  {colleagues.map((f) => {
                    const below = f.weeklyWorkloadHours < f.maxWorkloadHours;
                    return (
                      <div key={f.id} className="p-3 rounded-xl bg-slate-50 border border-border-subtle flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-semibold text-xs shrink-0">
                            {initials(f.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-slate-900 truncate">{f.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{f.designation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs shrink-0">
                          <span className="font-semibold text-slate-800 font-tabular-nums">
                            {f.weeklyWorkloadHours} / {f.maxWorkloadHours} h
                          </span>
                          <Badge variant={below ? "warning" : "success"}>{below ? "Below norm" : "Meets norm"}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </QueryState>
          </SectionCard>

          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-semibold text-sm text-slate-900 font-headline">Shortcuts</h3>
            {SHORTCUTS.map((link) => (
              <Link key={link.href} href={link.href} className="p-4 rounded-xl border border-border-subtle bg-white hover:border-primary-container block transition-all">
                <h4 className="font-semibold text-xs text-slate-900">{link.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{link.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
