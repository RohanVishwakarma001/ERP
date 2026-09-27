"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  studentService,
  attendanceService,
  timetableService,
  placementService,
  examService,
  aiService,
} from "@/services/domain-services";
import { authService } from "@/services/auth.service";
import {
  QrCode,
  Calendar,
  CreditCard,
  Briefcase,
  Bot,
  Send,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Bus,
} from "lucide-react";

export default function StudentDashboardPage() {
  const [quickAiInput, setQuickAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [admitCardFeedback, setAdmitCardFeedback] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();
  const studentIdentifier = currentUser?.rollNumber || currentUser?.id || "220102048";

  const { data: student } = useQuery({
    queryKey: ["currentStudent", studentIdentifier],
    queryFn: () => studentService.getStudentById(studentIdentifier),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["studentAttendance"],
    queryFn: attendanceService.getStudentAttendance,
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ["timetable"],
    queryFn: timetableService.getTimetable,
  });

  const { data: gradeCard } = useQuery({
    queryKey: ["gradeCard"],
    queryFn: examService.getGradeCard,
  });

  const { data: drives = [] } = useQuery({
    queryKey: ["drives"],
    queryFn: placementService.getDrives,
  });

  const todayClasses = timetable.filter((p) => p.day === "Monday").slice(0, 4);

  const overallAtt = student?.attendancePercent ?? 84.5;
  const studentName = student?.name || currentUser?.name || "Aarav Sharma";
  const rollNumber = student?.rollNumber || currentUser?.rollNumber || "220102048";
  const program = student?.program || "B.Tech CSE";
  const semester = student?.semester || 6;
  const section = student?.section || "CSE-6A";
  const cgpa = student?.cgpa ?? gradeCard?.cgpa ?? 8.92;
  const latestDrive = drives[0];

  const handleQuickAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAiInput.trim()) return;
    setIsAiThinking(true);
    setAiResponse(null);
    try {
      const res = await aiService.askQuery(quickAiInput);
      setAiResponse(res.answer);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* 1. Warm Personalized Greeting Card with Himalayan Campus Backdrop matching Stitch UI */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002541] via-[#0b3b60] to-[#00263d] text-white p-6 shadow-md">
          <div className="relative z-10 flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[11px] font-semibold tracking-wide">Campus Online • Dehradun</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">
                  Good Morning, {studentName.split(" ")[0]}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-sky-200 font-medium mt-0.5">
                  {program} • Sem {semester} • Roll #{rollNumber}
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">Sec {section}</span>
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full bg-white/10 mt-1">
                  3rd Year
                </span>
              </div>
            </div>

            {/* Academic Pulse Row */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-sky-200 block uppercase font-semibold">Overall CGPA</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-white font-tabular-nums">{cgpa.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +0.14
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-sky-400/20 text-sky-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-sky-200 block uppercase font-semibold">Attendance</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-white font-tabular-nums">{overallAtt.toFixed(1)}%</span>
                    <span className={`text-[10px] font-medium ${overallAtt >= 75 ? "text-emerald-300" : "text-red-300"}`}>
                      ({overallAtt >= 75 ? "Safe" : "Debarred Warning"})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Urgent Academic Alerts Banner */}
        <div className="bg-[#EFF4FF] border border-[#DCE9FF] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#BB0112] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                  Critical Notice
                </span>
                <span className="text-[11px] text-[#BB0112] font-semibold">UTU Ordinance 14(B)</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
                UTU Semester End-Term Examinations start June 2, 2026. Verify verified hall ticket eligibility.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAdmitCardFeedback(`Verified UTU Hall Ticket generated for ${studentName} (Roll #${rollNumber}). Clearance: Passed.`);
              setTimeout(() => setAdmitCardFeedback(null), 4000);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#0B3B60] hover:bg-[#082C49] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Download Admit Card</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {admitCardFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <span>{admitCardFeedback}</span>
          </div>
        )}

        {/* 3. Express Desk Quick Actions Grid matching Stitch UI */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Express Desk Services</h2>
            <span className="text-xs text-slate-400">8 Active Portals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/student/attendance"
              className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B3B60] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="font-semibold text-xs text-slate-900 mt-2">Scan Attendance</span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">Geo Live</span>
            </Link>

            <Link
              href="/admin/timetable"
              className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] text-[#0B3B60] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="font-semibold text-xs text-slate-900 mt-2">Class Schedule</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Today: {todayClasses.length} Lectures</span>
            </Link>

            <Link
              href="/admin/placement"
              className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#BB0112] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-semibold text-xs text-slate-900 mt-2">Placement Drives</span>
              <span className="text-[10px] text-red-600 font-semibold mt-0.5">{drives.length} Active Drives</span>
            </Link>

            <Link
              href="/admin/fees"
              className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0B3B60] hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="font-semibold text-xs text-slate-900 mt-2">Fee Ledger</span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                {student?.feesDue ? `Due: ₹${student.feesDue}` : "No Dues"}
              </span>
            </Link>
          </div>
        </div>

        {/* 4. Dual View: Today's Schedule & Subject-Wise Attendance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Lectures */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-headline">Today&apos;s Lecture Schedule</h3>
                <span className="text-xs text-slate-400">Monday • Section {section}</span>
              </div>
              <Badge variant="primary">Period 1 Active</Badge>
            </div>

            <div className="space-y-3">
              {todayClasses.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#0B3B60] font-bold text-xs flex items-center justify-center">
                      P{c.periodNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{c.subjectCode}: {c.subjectName}</h4>
                      <p className="text-[11px] text-slate-500">{c.facultyName} • Room {c.roomNumber}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white border border-[#E2E8F0] px-2 py-1 rounded">
                    {c.timeSlot}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Attendance Gauge */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="font-bold text-sm text-slate-900 font-headline">Subject-Wise Attendance</h3>
              <Badge variant={overallAtt >= 75 ? "success" : "error"}>{overallAtt.toFixed(1)}% Overall</Badge>
            </div>

            <div className="space-y-3">
              {attendance.slice(0, 5).map((att) => (
                <div key={att.subjectCode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate">{att.subjectName}</span>
                    <span
                      className={`font-bold font-tabular-nums ${
                        att.percentage < 75 ? "text-red-600" : "text-emerald-700"
                      }`}
                    >
                      {att.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        att.percentage < 75 ? "bg-red-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, att.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Campus Bus & Placement Opportunities Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Live Campus Bus Tracker */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0B3B60] flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">Campus Route 12</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-xs text-slate-500">Clock Tower ➔ Premnagar ➔ Campus</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="success">En Route</Badge>
              <span className="text-xs font-semibold text-slate-700 block mt-1">Bus #UK-07-PA-4012</span>
            </div>
          </div>

          {/* Placement Notice */}
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{latestDrive?.companyName || "TCS Digital Drive"}</h4>
                  <Badge variant="info">CTC: {latestDrive?.ctc || "7.50 - 9.20 LPA"}</Badge>
                </div>
                <p className="text-xs text-slate-500">{latestDrive?.roleTitle || "Systems Engineer (MTS)"} • Active Drive</p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Quick AI Copilot Query Bar matching Stitch UI */}
        <div className="bg-white rounded-2xl border border-[#CBD5E1] p-3 shadow-md space-y-2">
          <form onSubmit={handleQuickAiSubmit} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0B3B60] text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={quickAiInput}
              onChange={(e) => setQuickAiInput(e.target.value)}
              placeholder="Ask JBIT AI about attendance criteria, timetable, fees..."
              className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 px-1"
            />
            <button
              type="submit"
              disabled={isAiThinking}
              className="h-9 px-4 rounded-xl bg-[#0B3B60] hover:bg-[#082C49] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {aiResponse && (
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-slate-700 animate-in fade-in">
              <p className="font-semibold text-slate-900 mb-1">JBIT AI Copilot Response:</p>
              <p className="leading-relaxed">{aiResponse}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
