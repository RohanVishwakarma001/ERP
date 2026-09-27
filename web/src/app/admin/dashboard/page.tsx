"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  studentService,
  departmentService,
  facultyService,
  placementService,
  noticeService,
  operationsService,
  examService,
} from "@/services/domain-services";
import { authService } from "@/services/auth.service";
import {
  Building2,
  Users2,
  Briefcase,
  CalendarCheck2,
  ArrowRight,
  BellRing,
  Bus,
  Bed,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function AdminOverviewDashboard() {
  const currentUser = authService.getCurrentUser();

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentService.getStudents,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentService.getDepartments,
  });

  const { data: notices = [] } = useQuery({
    queryKey: ["notices"],
    queryFn: noticeService.getNotices,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ["routes"],
    queryFn: operationsService.getTransportRoutes,
  });

  const { data: drives = [] } = useQuery({
    queryKey: ["drives"],
    queryFn: placementService.getDrives,
  });

  const { data: examCycles = [] } = useQuery({
    queryKey: ["examCycles"],
    queryFn: examService.getCycles,
  });

  const totalStudentsCount = students.length > 0 ? (students.length * 35).toLocaleString() : "1,120";
  const eligibleStudents = students.filter((s) => s.debarmentStatus !== "DEBARRED");
  const eligiblePercentage =
    students.length > 0
      ? ((eligibleStudents.length / students.length) * 100).toFixed(1)
      : "84.5";

  const adminName = currentUser?.name || "Col. Rajesh Verma (Retd.)";
  const activeBus = routes[0];
  const activeCycle = examCycles[0];

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        {/* Top Executive Himalayan Banner matching Stitch UI */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#002541] via-[#0b3b60] to-[#003c5e] text-white p-6 sm:p-8 shadow-md">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-sky-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Campus Online • Dehradun Foothills Sub-Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">
                Executive Academic Administration Hub
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
                Welcome, {adminName}. Institutional telemetry indicates 100% UTU compliance across {departments.length} departments, {totalStudentsCount} enrolled students, and ongoing examination scheduling.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/ai-copilot"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0B3B60] hover:bg-sky-50 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#0B3B60]" />
                <span>Launch AI Copilot</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Core High-Level KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Student Cadre"
            value={totalStudentsCount}
            unit="Enrolled"
            icon={<Users2 className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft={`${eligiblePercentage}% Eligible for Hall Tickets`}
            footerRight="Ordinance 14(B)"
            footerRightColor="success"
          />
          <KpiCard
            title="Academic Departments"
            value={departments.length.toString()}
            unit="Units"
            icon={<Building2 className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft={`${departments.filter((d) => d.nbaAccredited || d.accreditationStatus === "NBA Tier-1").length} NBA Accreditations`}
            footerRight="100% UTU Affiliated"
            footerRightColor="success"
          />
          <KpiCard
            title="Placement Drives"
            value={drives.length.toString()}
            unit="Active"
            icon={<Briefcase className="w-5 h-5 text-emerald-600" />}
            footerLeft="Highest Package: ₹22.50 LPA"
            footerRight="TCS, AWS, Adobe"
            footerRightColor="info"
          />
          <KpiCard
            title="Examination Cycle"
            value="June 02"
            unit="Commences"
            icon={<CalendarCheck2 className="w-5 h-5 text-amber-600" />}
            footerLeft={activeCycle?.name || "UTU End-Term 2026"}
            footerRight="Seating Ready"
            footerRightColor="warning"
          />
        </div>

        {/* Operational Modules Quick Jump Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-headline">Enterprise Command Shortcuts</h2>
            <span className="text-xs text-slate-500">Quick Access to Core Workflows</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/admin/departments"
              className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] hover:shadow-md transition-all group flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0B3B60] block">
                  Department Workload
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Faculty ratios &amp; NBA accreditation
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B60] transition-colors" />
            </Link>

            <Link
              href="/admin/students"
              className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] hover:shadow-md transition-all group flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0B3B60] block">
                  Attendance Debarment
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Ordinance 14(B) &amp; Condonation
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B60] transition-colors" />
            </Link>

            <Link
              href="/admin/timetable"
              className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] hover:shadow-md transition-all group flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0B3B60] block">
                  Timetable Engine
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Clash detection &amp; room matrix
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B60] transition-colors" />
            </Link>

            <Link
              href="/admin/exams"
              className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] hover:shadow-md transition-all group flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0B3B60] block">
                  COE Seating &amp; Mark Lock
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Cryptographic UTU verification
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B60] transition-colors" />
            </Link>
          </div>
        </div>

        {/* Dual Panel: Recent Circulars & Fleet Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Campus Circulars */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#0B3B60]" />
                <h3 className="font-bold text-sm text-slate-900 font-headline">Campus Circulars &amp; Notices</h3>
              </div>
              <Badge variant="primary">UTU Master Feed</Badge>
            </div>

            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{n.publisher}</span>
                    <span className="text-[10px] text-slate-400">{n.date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{n.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure & Telematics Status */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-headline pb-3 border-b border-[#F1F5F9]">
              Campus Operations &amp; Telematics
            </h3>

            <div className="space-y-3">
              {/* Bus Telematics */}
              <div className="p-3 rounded-xl bg-[#EFF4FF] border border-[#DCE9FF] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0B3B60] text-white flex items-center justify-center">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">
                      {activeBus?.busNumber ? `Bus #${activeBus.busNumber} Active` : "Campus Transit Active"}
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      {activeBus?.routeTitle || "Clock Tower to JBIT Campus"}
                    </p>
                  </div>
                </div>
                <Badge variant="success">En Route</Badge>
              </div>

              {/* Hostel Status */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Bed className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Hostel Allocation Ratio</h5>
                    <p className="text-[10px] text-slate-500">Shivalik &amp; Alaknanda Hostels</p>
                  </div>
                </div>
                <span className="font-bold text-xs text-slate-800">88.5% Occupied</span>
              </div>

              {/* Central Library Circulation */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Central Library Circulation</h5>
                    <p className="text-[10px] text-slate-500">RFID Circulation Desk Online</p>
                  </div>
                </div>
                <span className="font-bold text-xs text-emerald-700">100% Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
