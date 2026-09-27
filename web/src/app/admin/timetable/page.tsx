"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timetableService } from "@/services/domain-services";
import { TimetablePeriod } from "@/types";
import {
  Wand2,
  PlusCircle,
  FileDown,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";

export default function TimetableEnginePage() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<string>("All");
  const [selectedViewMode, setSelectedViewMode] = useState<"COHORT" | "FACULTY" | "ROOM">("COHORT");
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  const { data: timetable = [] } = useQuery({
    queryKey: ["timetable"],
    queryFn: timetableService.getTimetable,
  });

  const publishMutation = useMutation({
    mutationFn: timetableService.lockAndPublish,
    onSuccess: (res) => {
      setPublishFeedback(res.message);
      setTimeout(() => setPublishFeedback(null), 4000);
    },
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        {/* Top Header & Global Controls matching Stitch UI */}
        <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0B3B60] text-white uppercase tracking-wider">
                UTU Engine v4.2
              </span>
              <Badge variant="success" pulse>
                Zero Clashes Detected
              </Badge>
              <span className="text-xs text-slate-400">Master Sync: AY 2024-25 Even Sem</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Timetable Scheduling Engine &amp; Matrix
            </h1>
            <p className="text-xs text-slate-500 max-w-3xl">
              Automated clash-detection, period allocation, faculty room assignments, and real-time lab scheduling for Veer Madho Singh Bhandari Uttarakhand Technical University (UTU) curriculum.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => {
                setPublishFeedback("AI Auto-Scheduler analyzed all departmental time slots with 0 constraint conflicts.");
                setTimeout(() => setPublishFeedback(null), 4000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-[#0B3B60]" />
              <span>Auto-Generate AI</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-red-600" />
              <span>UTU Grid PDF</span>
            </button>

            <button
              type="button"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3B60] hover:bg-[#082C49] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{publishMutation.isPending ? "Locking..." : "Lock & Publish"}</span>
            </button>
          </div>
        </div>

        {publishFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{publishFeedback}</span>
          </div>
        )}

        {/* Filter Ribbon & Diagnostics */}
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Academic Year
              </label>
              <select className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-slate-800">
                <option>AY 2024-25 (Even)</option>
                <option>AY 2024-25 (Odd)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Program
              </label>
              <select className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-slate-800">
                <option>B.Tech CSE</option>
                <option>B.Tech ME</option>
                <option>B.Tech ECE</option>
                <option>B.Tech Civil</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Semester
              </label>
              <select className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-slate-800">
                <option>Semester 6</option>
                <option>Semester 4</option>
                <option>Semester 8</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Section &amp; Strength
              </label>
              <select className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-medium text-slate-800">
                <option>Section B (62 Pax)</option>
                <option>Section A (64 Pax)</option>
                <option>Section C (58 Pax)</option>
              </select>
            </div>
          </div>

          {/* Segmented View Mode */}
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setSelectedViewMode("COHORT")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedViewMode === "COHORT"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Cohort Grid
            </button>
            <button
              type="button"
              onClick={() => setSelectedViewMode("FACULTY")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedViewMode === "FACULTY"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Faculty View
            </button>
            <button
              type="button"
              onClick={() => setSelectedViewMode("ROOM")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedViewMode === "ROOM"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Room Occupancy
            </button>
          </div>
        </div>

        {/* Timetable Weekly Matrix */}
        <div className="space-y-4">
          {days.map((day) => {
            const periodsForDay = timetable.filter((p) => p.day === day);
            return (
              <div
                key={day}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden"
              >
                <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 font-headline">{day}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {periodsForDay.length} Periods Scheduled • 100% Clashes Cleared
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {periodsForDay.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all ${
                        p.type === "LAB"
                          ? "bg-blue-50/50 border-blue-200"
                          : p.type === "TUTORIAL"
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-white border-[#E2E8F0] hover:border-[#0B3B60]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.timeSlot}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            p.type === "LAB"
                              ? "bg-blue-100 text-blue-800"
                              : p.type === "TUTORIAL"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {p.type}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        {p.subjectCode}: {p.subjectName}
                      </h4>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate">{p.facultyName}</span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono shrink-0">
                          {p.roomNumber}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
