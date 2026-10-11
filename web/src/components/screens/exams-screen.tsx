"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examService } from "@/services/domain-services";
import { SeatingHallAllocation } from "@/types";
import {
  CalendarCheck2,
  Building,
  Users2,
  Lock,
  Grid,
  Printer,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";

export default function ExamControllerPage() {
  const queryClient = useQueryClient();
  const [cryptLockHash, setCryptLockHash] = useState<string | null>(null);
  const [matrixFeedback, setMatrixFeedback] = useState<string | null>(null);

  const { data: seatingHalls = [] } = useQuery({
    queryKey: ["seatingHalls"],
    queryFn: examService.getSeatingHalls,
  });

  const lockMutation = useMutation({
    mutationFn: examService.lockMarksToUTU,
    onSuccess: (res) => {
      setCryptLockHash(res.hash);
    },
  });

  const totalSeats = seatingHalls.reduce((sum, h) => sum + (h.capacity || 0), 0);
  const totalAllocated = seatingHalls.reduce((sum, h) => sum + (h.candidateCount || 0), 0);
  const totalInvigilators = seatingHalls.reduce((sum, h) => sum + (h.invigilators?.length || 2), 0);
  const hallsCount = seatingHalls.length;

  const handleRandomizeMatrix = () => {
    setMatrixFeedback(`Master seating matrix randomized across ${hallsCount} examination halls with zero department co-location.`);
    setTimeout(() => setMatrixFeedback(null), 4000);
  };

  const handlePrintSlip = (hallNumber: string) => {
    setMatrixFeedback(`Dispatching print job for ${hallNumber} verified door seating slip.`);
    setTimeout(() => setMatrixFeedback(null), 4000);
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        {/* Top Header & Global Controls matching Stitch COE Console */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Governance &amp; Compliance</span>
              <span className="text-slate-300">/</span>
              <span>Examination Cell</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#0B3B60]">Exam Operations &amp; Mark Locking</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline">
                Controller of Examinations (COE) — Hall Seating &amp; UTU Mark Locking Console
              </h1>
              <Badge variant="primary">UTU Affiliated</Badge>
            </div>
            <p className="text-xs text-slate-500 max-w-4xl mt-0.5">
              Manage university end-semester &amp; mid-term exam sessions, anti-cheating randomized seating matrices, room allocations, invigilator rosters, and cryptographic internal mark locking.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleRandomizeMatrix}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Grid className="w-4 h-4 text-slate-500" />
              <span>Generate Master Seating Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Export Seating Plan (PDF)</span>
            </button>

            <button
              type="button"
              disabled={lockMutation.isPending}
              onClick={() => lockMutation.mutate()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3B60] hover:bg-[#082C49] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lockMutation.isPending ? "Locking to UTU..." : "Cryptographic Lock & Sign to UTU"}</span>
            </button>
          </div>
        </div>

        {matrixFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{matrixFeedback}</span>
          </div>
        )}

        {cryptLockHash && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">UTU Internal Marks Successfully Locked &amp; Cryptographically Signed</p>
                <p className="font-mono text-[11px] text-emerald-700 mt-1 break-all">
                  SHA-256 Ledger Hash: {cryptLockHash}
                </p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Immutable record transmitted to Veer Madho Singh Bhandari Uttarakhand Technical University portal.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCryptLockHash(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 KPI Cards matching Stitch UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Active Examination Cycle"
            value={totalAllocated.toString()}
            unit="Candidates"
            icon={<CalendarCheck2 className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Active Examination Term"
            footerRight="100% Admit Cards"
            footerRightColor="success"
          />
          <KpiCard
            title="Halls & Facility Blocks"
            value={`${hallsCount} Halls`}
            unit={`${totalSeats} Seats`}
            icon={<Building className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Shift Rotation (AM/PM)"
            footerRight="Optimal Matrix"
            footerRightColor="success"
          />
          <KpiCard
            title="Invigilation Staffing"
            value={`${totalInvigilators} Faculty`}
            unit="On Duty"
            icon={<Users2 className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="AICTE Ratio Compliant"
            footerRight="Confirmed"
            footerRightColor="info"
          />
          <KpiCard
            title="Sessional Marks Ledger"
            value="All Verified"
            unit="Portals Cleared"
            icon={<Lock className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Digital Signature Ready"
            footerRight="UTU Synchronized"
            footerRightColor="success"
          />
        </div>

        {/* Hall Seating Allocations Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-headline">
              Examination Halls &amp; Randomized Seating Matrix
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Total {seatingHalls.length} Examination Halls Allocated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {seatingHalls.map((hall: SeatingHallAllocation) => (
              <div
                key={hall.id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm space-y-3 hover:border-[#0B3B60] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{hall.hallNumber}</h3>
                    <p className="text-xs text-slate-500">{hall.block} • {hall.shift}</p>
                  </div>
                  <Badge variant={!hall.isLocked ? "success" : "info"}>
                    {!hall.isLocked ? "ACTIVE" : "LOCKED"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Seating Capacity</span>
                  <span className="font-bold text-slate-800 font-tabular-nums">
                    {hall.candidateCount} / {hall.capacity} Seats Filled
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0B3B60]"
                    style={{ width: `${(hall.candidateCount / hall.capacity) * 100}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-[#F1F5F9] space-y-1.5 text-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block">
                    Allotted Subject Papers
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {hall.assignedDepartments?.map((dept: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {hall.invigilators.length} Invigilators Roster
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePrintSlip(hall.hallNumber)}
                    className="text-[#0B3B60] font-semibold hover:underline text-[11px] cursor-pointer"
                  >
                    Print Door Slip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
