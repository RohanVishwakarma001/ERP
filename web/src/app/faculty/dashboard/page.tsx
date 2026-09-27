"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { facultyService, timetableService } from "@/services/domain-services";
import { authService } from "@/services/auth.service";
import {
  QrCode,
  Calendar,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  X,
} from "lucide-react";

export default function FacultyDashboardPage() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(42);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();

  const { data: facultyList = [] } = useQuery({
    queryKey: ["facultyList"],
    queryFn: facultyService.getFacultyList,
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ["timetable"],
    queryFn: timetableService.getTimetable,
  });

  const facultyMember =
    facultyList.find(
      (f) =>
        f.email.toLowerCase() === currentUser?.email?.toLowerCase() ||
        f.employeeId === currentUser?.employeeId ||
        f.id === currentUser?.id,
    ) || facultyList[0];

  const facultyName = facultyMember?.name || currentUser?.name || "Dr. V. K. Bhatt";
  const departmentName = facultyMember?.department || "Computer Science & Engineering";
  const designation = facultyMember?.designation || "Professor & Head of Department";
  const employeeId = facultyMember?.employeeId || currentUser?.employeeId || "FAC-CSE-001";
  const workloadHours = facultyMember?.weeklyWorkloadHours || 18.0;

  const currentClass = timetable.find((t) => t.periodNumber === 1) || {
    subjectCode: "CS-601",
    subjectName: "Compiler Design",
    roomNumber: "LH-302",
    batchSection: "CSE-6A",
    timeSlot: "09:00 AM - 10:00 AM",
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQrModalOpen) {
      interval = setInterval(() => {
        setCountdown((c) => (c <= 1 ? 60 : c - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isQrModalOpen]);

  const handleSimulateSync = () => {
    setIsQrModalOpen(false);
    setFeedbackToast("56 Students Verified & Logged via Dynamic QR into PostgreSQL Attendance Session");
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  return (
    <DashboardLayout role="FACULTY">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Faculty Profile Hero Card matching Stitch Academic Hub */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B3B60] via-[#002541] to-[#00263d] text-white p-6 shadow-md">
          <div className="relative z-10 flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-sky-200">
                    AY 2025-26 • Even Sem
                  </span>
                  <span className="text-xs text-sky-200 font-semibold">{departmentName}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">
                  Good Morning, {facultyName} 👋
                </h1>
                <p className="text-xs sm:text-sm text-sky-200 mt-0.5">
                  {designation} • Himalayan Wing • ID: {employeeId}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 ring-2 ring-white/20 shrink-0">
                <img
                  src={facultyMember?.avatarUrl || "/assets/faculty-avatar.png"}
                  alt={facultyName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Quick Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-xs">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-200 block uppercase font-semibold">Today&apos;s Load</span>
                  <span className="text-lg font-bold font-tabular-nums">{facultyMember?.assignedSubjects?.length || 3} / 4</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px]">
                  Active
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-200 block uppercase font-semibold">Students</span>
                  <span className="text-lg font-bold font-tabular-nums">180</span>
                </div>
                <span className="text-[10px] text-sky-200">CSE Sections</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-200 block uppercase font-semibold">Avg Attendance</span>
                  <span className="text-lg font-bold font-tabular-nums">84.5%</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +1.8%
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-200 block uppercase font-semibold">Workload Hours</span>
                  <span className="text-lg font-bold text-sky-200 font-tabular-nums">{workloadHours.toFixed(1)}h</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px]">AICTE Norm</span>
              </div>
            </div>
          </div>
        </div>

        {feedbackToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* CURRENT PERIOD ALERT CARD (Dynamic Focal Component) */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] shadow-sm p-6 space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-amber-500"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Live Classroom Session Active
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Period 1 • {currentClass.timeSlot || "09:00 AM - 10:00 AM"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-headline">
                {currentClass.subjectCode}: {currentClass.subjectName}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Room {currentClass.roomNumber} • Section {currentClass.batchSection || "CSE-6A"} (60 Enrolled) • Himalayan Wing
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#0B3B60] hover:bg-[#082C49] text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Broadcast Dynamic QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Teaching Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] text-[#0B3B60] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Lab Assignment Hub</h3>
            <p className="text-xs text-slate-500">Review parser implementations and Cloud container submissions.</p>
            <span className="text-xs text-[#0B3B60] font-semibold block pt-1 hover:underline cursor-pointer">
              2 Active Assignments
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">UTU Mark Entry Portal</h3>
            <p className="text-xs text-slate-500">Continuous internal assessment and practical marks locking to UTU node.</p>
            <span className="text-xs text-amber-700 font-semibold block pt-1 hover:underline cursor-pointer">
              Lock by June 2
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Weekly Faculty Schedule</h3>
            <p className="text-xs text-slate-500">18 Contact Hours compliant with AICTE statutory guidelines.</p>
            <span className="text-xs text-emerald-700 font-semibold block pt-1 hover:underline cursor-pointer">
              100% Conflict Free
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic QR Broadcasting Modal matching Stitch Hub */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-slate-900 font-headline uppercase tracking-wider">
                Dynamic Class QR Code
              </h3>
              <button onClick={() => setIsQrModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="w-48 h-48 bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center">
                <QrCode className="w-40 h-40 text-slate-900" />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-700">
                {currentClass.subjectCode} • Period 1 • Room {currentClass.roomNumber}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Rotating in</span>
                <span className="font-bold text-red-600 font-tabular-nums">{countdown}s</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateSync}
                className="flex-1 py-2.5 rounded-xl bg-[#0B3B60] hover:bg-[#082C49] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm Present Students
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
