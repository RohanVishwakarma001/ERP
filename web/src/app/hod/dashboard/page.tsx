"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { departmentService, studentService, facultyService } from "@/services/domain-services";
import {
  Building2,
  Users2,
  GraduationCap,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function HodDashboardPage() {
  const { data: faculty = [] } = useQuery({
    queryKey: ["faculty"],
    queryFn: facultyService.getFacultyList,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentService.getStudents,
  });

  const deptStudents = students.filter((s) => s.program.includes("CSE") || s.section.includes("CSE") || s.program.includes("Computer"));
  const cseStudentsCount = deptStudents.length > 0 ? deptStudents.length : students.length;
  const targetCohort = deptStudents.length > 0 ? deptStudents : students;
  const atRiskCount = targetCohort.filter((s) => s.attendancePercent < 75).length;
  const totalFaculty = faculty.length;
  const phDCount = faculty.filter((f) => f.qualification?.includes("Ph.D") || f.designation?.includes("Professor")).length;
  const avgAttendance = targetCohort.length > 0 ? (targetCohort.reduce((acc, s) => acc + s.attendancePercent, 0) / targetCohort.length).toFixed(1) : "85.0";

  return (
    <DashboardLayout role="HOD">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Departmental Leadership</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0B3B60]">HOD Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Computer Science &amp; Engineering — HOD Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Department academic review, faculty teaching loads, Ordinance 14(B) low attendance interventions, and laboratory infrastructure status.
            </p>
          </div>

          <Badge variant="primary" pulse>
            NBA Tier-1 Accredited Unit
          </Badge>
        </div>

        {/* 4 HOD KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Department Cadre"
            value={cseStudentsCount.toString()}
            unit="Enrolled"
            icon={<Users2 className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="B.Tech CSE & Specializations"
            footerRight={`${avgAttendance}% Attendance`}
            footerRightColor="success"
          />
          <KpiCard
            title="Department Faculty"
            value={totalFaculty.toString()}
            unit="Professors"
            icon={<GraduationCap className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft={`${phDCount} Ph.D Holders`}
            footerRight="FSR 1:18.5"
            footerRightColor="info"
          />
          <KpiCard
            title="At-Risk Students (<75%)"
            value={atRiskCount.toString()}
            unit="Condonations"
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            footerLeft="Medical & Review Slips"
            footerRight="Review Required"
            footerRightColor="warning"
          />
          <KpiCard
            title="Active Research Labs"
            value="6"
            unit="Facilities"
            icon={<Building2 className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="AI, IoT, Cloud, Networks"
            footerRight="100% Operational"
            footerRightColor="success"
          />
        </div>

        {/* Department Faculty Workload & Quick Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-headline">Department Faculty Workload Roster</h3>
            <div className="space-y-3">
              {faculty.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0B3B60] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {f.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{f.name}</h4>
                      <p className="text-[11px] text-slate-500">{f.designation} • {f.qualification}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-800 font-tabular-nums">
                      {f.weeklyWorkloadHours} / {f.maxWorkloadHours} Hrs/Wk
                    </span>
                    <Badge variant={f.weeklyWorkloadHours <= 20 ? "success" : "warning"}>
                      {f.weeklyWorkloadHours <= 20 ? "Optimal" : "Near Cap"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 font-headline">HOD Action Shortcuts</h3>

            <Link
              href="/admin/departments"
              className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] shadow-2xs block transition-all"
            >
              <h4 className="font-bold text-xs text-slate-900">Manage Curriculum &amp; Courses</h4>
              <p className="text-[11px] text-slate-500 mt-1">Review UTU syllabus progression and elective allocations.</p>
            </Link>

            <Link
              href="/admin/students"
              className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] shadow-2xs block transition-all"
            >
              <h4 className="font-bold text-xs text-slate-900">Debarment &amp; Condonations</h4>
              <p className="text-[11px] text-slate-500 mt-1">Process medical slips under UTU Ordinance 14(B).</p>
            </Link>

            <Link
              href="/admin/timetable"
              className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] shadow-2xs block transition-all"
            >
              <h4 className="font-bold text-xs text-slate-900">Department Timetable Engine</h4>
              <p className="text-[11px] text-slate-500 mt-1">Verify lecture slots and classroom matrix.</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
