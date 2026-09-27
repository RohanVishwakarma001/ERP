"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { attendanceService } from "@/services/domain-services";
import {
  QrCode,
  Calendar,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function StudentAttendancePage() {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "SCANNER" | "REQUESTS">("OVERVIEW");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const { data: attendance = [] } = useQuery({
    queryKey: ["studentAttendance"],
    queryFn: attendanceService.getStudentAttendance,
  });

  const { data: corrections = [] } = useQuery({
    queryKey: ["attendanceCorrections"],
    queryFn: attendanceService.getAttendanceCorrections,
  });

  const [petitionFeedback, setPetitionFeedback] = useState<string | null>(null);
  const totalConducted = attendance.reduce((s, a) => s + (a.conducted || 0), 0);
  const totalAttended = attendance.reduce((s, a) => s + (a.attended || 0), 0);
  const overallPercent = totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(1) : "0.0";

  const simulateQrScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult("Attendance Successfully Verified: CS-602 Cloud Computing (Period 2) • Geofence Validated (JBIT Block B)");
    }, 1800);
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Segmented Tab Switcher matching Stitch Attendance QR Hub */}
        <div className="bg-[#EFF4FF] p-1.5 rounded-2xl flex items-center justify-between border border-[#DCE9FF]">
          <button
            type="button"
            onClick={() => setActiveTab("OVERVIEW")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "OVERVIEW"
                ? "bg-white text-[#0B3B60] shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Attendance Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SCANNER")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "SCANNER"
                ? "bg-white text-[#0B3B60] shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REQUESTS")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "REQUESTS"
                ? "bg-white text-[#0B3B60] shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Correction Petitions</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* Macro Summary Metric Card */}
            <div className="p-6 rounded-2xl bg-[#0B3B60] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-[11px] uppercase font-bold text-sky-200 tracking-wider">
                  UTU &amp; JBIT Mandatory Status
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold font-tabular-nums">{overallPercent}%</span>
                  <span className="text-xs text-sky-200">Overall Attendance</span>
                </div>
                <p className="text-xs text-sky-200 mt-1">
                  Requirement: Minimum 75.0% required under Ordinance 14(B) for end-term admit cards.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-xs shrink-0 text-center">
                <div>
                  <span className="text-[10px] text-sky-200 block uppercase font-semibold">Conducted</span>
                  <span className="font-bold text-base font-tabular-nums">{totalConducted}</span>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div>
                  <span className="text-[10px] text-sky-200 block uppercase font-semibold">Attended</span>
                  <span className="font-bold text-base font-tabular-nums text-emerald-300">{totalAttended}</span>
                </div>
              </div>
            </div>

            {/* Subject Breakdown Cards */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Subject-Wise Ordinance Ledger
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attendance.map((s) => (
                  <div
                    key={s.subjectCode}
                    className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">
                          {s.subjectName}
                        </h3>
                        <p className="text-[11px] text-slate-500">{s.subjectCode} • {s.facultyName}</p>
                      </div>
                      <Badge
                        variant={
                          s.percentage >= 85
                            ? "success"
                            : s.percentage >= 75
                            ? "info"
                            : s.percentage >= 65
                            ? "warning"
                            : "error"
                        }
                      >
                        {s.status}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between text-xs pt-1">
                      <span className="text-slate-500 font-medium">
                        {s.attended} / {s.conducted} Conducted
                      </span>
                      <span className="font-bold font-tabular-nums text-slate-800">
                        {s.percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.percentage < 75 ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Heatmap Log */}
            <div className="p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <h3 className="font-bold text-sm text-slate-900 font-headline">
                  {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} Attendance Log
                </h3>
                <span className="text-xs text-slate-400">Semester 6 CSE</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Tech Fest
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-xs pt-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => (
                  <span key={idx} className="font-bold text-slate-400 py-1">{d}</span>
                ))}
                {Array.from({ length: 28 }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isPresent = dayNum % 5 !== 0 && dayNum % 7 !== 0;
                  const isAbsent = dayNum === 6;
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg font-bold font-tabular-nums ${
                        isAbsent
                          ? "bg-red-100 text-red-700"
                          : isPresent
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scan QR */}
        {activeTab === "SCANNER" && (
          <div className="p-8 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
              <MapPin className="w-3.5 h-3.5" />
              <span>Geofence Validated • JBIT Block B Coordinates</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 font-headline">
              Classroom Attendance QR Scanner
            </h2>
            <p className="text-xs text-slate-500 max-w-md">
              Point your camera at the faculty&apos;s rotating dynamic QR code displayed on the classroom projection screen to record authenticated attendance.
            </p>

            {/* Viewfinder Mockup */}
            <div className="relative w-64 h-64 rounded-2xl bg-slate-900 border-4 border-[#0B3B60] flex items-center justify-center overflow-hidden shadow-xl">
              {isScanning ? (
                <div className="flex flex-col items-center gap-2 text-white">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin"></div>
                  <span className="text-xs font-semibold">Validating with UTU Node...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <QrCode className="w-16 h-16 text-slate-600 animate-pulse" />
                  <span className="text-xs font-medium">Ready to scan token</span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isScanning}
              onClick={simulateQrScan}
              className="px-6 py-3 rounded-xl bg-[#0B3B60] hover:bg-[#082C49] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Simulate QR Token Capture</span>
            </button>

            {scanResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{scanResult}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Requests */}
        {activeTab === "REQUESTS" && (
          <div className="p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Attendance Correction Petitions
              </h2>
              <button
                type="button"
                onClick={() => {
                  setPetitionFeedback("Attendance correction petition registered for CSE faculty verification.");
                  setTimeout(() => setPetitionFeedback(null), 4000);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0B3B60] text-white text-xs font-semibold cursor-pointer"
              >
                + New Correction Petition
              </button>
            </div>

            {petitionFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <span>{petitionFeedback}</span>
              </div>
            )}

            <div className="space-y-3">
              {corrections.map((req: { id: string; subject: string; date: string; period: string; status: string; reason: string; reviewedBy: string }) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{req.subject}</h4>
                      <p className="text-slate-500">{req.date} • {req.period}</p>
                    </div>
                    <Badge variant={req.status === "APPROVED" ? "success" : "warning"}>
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-slate-600">Reason: {req.reason}</p>
                  <p className="text-[11px] text-slate-400">Reviewed by: {req.reviewedBy}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
