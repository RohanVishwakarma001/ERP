"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentService } from "@/services/domain-services";
import { Student } from "@/types";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Ban,
  FileDown,
  UserPlus,
  ShieldAlert,
  Gavel,
  Ticket,
  Eye,
  Check,
  X,
} from "lucide-react";

export default function StudentRosterPage() {
  const queryClient = useQueryClient();
  const [selectedDebarmentFilter, setSelectedDebarmentFilter] = useState<string>("ALL");
  const [selectedStudentForReview, setSelectedStudentForReview] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: studentService.getStudents,
  });

  const [bulkReleaseFeedback, setBulkReleaseFeedback] = useState<string | null>(null);
  const totalStudents = students.length;
  const eligibleStudents = students.filter((s) => s.attendancePercent >= 75);
  const atRiskStudents = students.filter((s) => s.attendancePercent >= 65 && s.attendancePercent < 75);
  const debarredStudents = students.filter((s) => s.attendancePercent < 65 || s.debarmentStatus === "DEBARRED");

  const toggleHallTicketMutation = useMutation({
    mutationFn: studentService.toggleHallTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const updateDebarmentMutation = useMutation({
    mutationFn: ({ studentId, status }: { studentId: string; status: Student["debarmentStatus"] }) =>
      studentService.updateDebarmentStatus(studentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setSelectedStudentForReview(null);
    },
  });

  const filteredStudents = students.filter((s) => {
    if (selectedDebarmentFilter === "ALL") return true;
    return s.debarmentStatus === selectedDebarmentFilter;
  });

  const columns: Column<Student>[] = [
    {
      header: "Student & Roll Number",
      accessorKey: "name",
      sortable: true,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0B3B60] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-slate-200">
            {s.name.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block leading-tight">{s.name}</span>
            <span className="text-[11px] text-slate-500 font-mono">Roll: #{s.rollNumber}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Program / Section",
      accessorKey: "program",
      sortable: true,
      cell: (s) => (
        <div>
          <span className="font-medium text-slate-800 block leading-tight">{s.program}</span>
          <span className="text-[11px] text-slate-500">Sem {s.semester} • Sec {s.section}</span>
        </div>
      ),
    },
    {
      header: "Attendance % (Ord 14B)",
      accessorKey: "attendancePercent",
      sortable: true,
      cell: (s) => {
        const isCritical = s.attendancePercent < 65;
        const isWarning = s.attendancePercent >= 65 && s.attendancePercent < 75;
        return (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-bold font-tabular-nums text-sm ${
                  isCritical ? "text-red-600" : isWarning ? "text-amber-600" : "text-emerald-700"
                }`}
              >
                {s.attendancePercent}%
              </span>
              <span className="text-[10px] text-slate-400">
                ({s.attendedClasses}/{s.conductedClasses})
              </span>
            </div>
            <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1">
              <div
                className={`h-full rounded-full ${
                  isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${s.attendancePercent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "Debarment Status",
      accessorKey: "debarmentStatus",
      sortable: true,
      cell: (s) => {
        if (s.debarmentStatus === "ELIGIBLE") {
          return <Badge variant="success">Eligible</Badge>;
        }
        if (s.debarmentStatus === "CONDONATION") {
          return (
            <Badge variant="warning" pulse>
              At-Risk • Condonation
            </Badge>
          );
        }
        return <Badge variant="error">Debarred &lt;65%</Badge>;
      },
    },
    {
      header: "Hall Ticket",
      accessorKey: "hallTicketStatus",
      sortable: true,
      cell: (s) => (
        <button
          type="button"
          onClick={() => toggleHallTicketMutation.mutate(s.id)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
            s.hallTicketStatus === "RELEASED"
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-red-100 text-red-800 hover:bg-red-200"
          }`}
          title="Click to toggle admit card status"
        >
          <Ticket className="w-3 h-3" />
          <span>{s.hallTicketStatus === "RELEASED" ? "Released" : "Withheld"}</span>
        </button>
      ),
    },
    {
      header: "Actions",
      cell: (s) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedStudentForReview(s)}
            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-slate-600 transition-colors"
            title="Review attendance condonation petition"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Academic Affairs</span>
              <span className="text-slate-300">/</span>
              <span>Student Administration</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#0B3B60]">Debarment Registry</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline">
                Student Roster &amp; UTU Attendance Debarment Registry
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0B3B60]/10 text-[#0B3B60] text-xs font-semibold">
                <Gavel className="w-3.5 h-3.5" />
                Ordinance 14(B) Enforcement Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-4xl">
              Manage enrolled student records, monitor live 75% attendance ordinance thresholds, process medical &amp; OD condonation petitions, and issue or withhold semester examination hall tickets in real time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-red-600" />
              <span>Export Debarment Gazette</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBulkReleaseFeedback(`Bulk Admit Cards successfully released for all ${eligibleStudents.length} eligible candidates with ≥75% attendance.`);
                setTimeout(() => setBulkReleaseFeedback(null), 4000);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#0B3B60] text-xs font-semibold transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Bulk Admit Card Release</span>
            </button>
          </div>
        </div>

        {bulkReleaseFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bulkReleaseFeedback}</span>
          </div>
        )}

        {/* 4 Cadre Analytics KPI Cards matching Stitch UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Enrolled Cohort"
            value={totalStudents.toString()}
            unit="Students"
            icon={<Users className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Active Academic Depts"
            footerRight="100% KYC Verified"
            footerRightColor="neutral"
          />
          <KpiCard
            title="Eligible for Hall Tickets (≥75%)"
            value={eligibleStudents.length.toString()}
            unit="Candidates"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            footerLeft={`${totalStudents > 0 ? ((eligibleStudents.length / totalStudents) * 100).toFixed(1) : 0}% Cleared`}
            footerRight="Safe Zone"
            footerRightColor="success"
          />
          <KpiCard
            title="At-Risk / Condonation Desk"
            value={atRiskStudents.length.toString()}
            unit="Under Review"
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            footerLeft="65.0% – 74.9% Gap"
            footerRight="Review Required"
            footerRightColor="warning"
          />
          <KpiCard
            title="Debarred Students (<65%)"
            value={debarredStudents.length.toString()}
            unit="Withheld"
            icon={<Ban className="w-5 h-5 text-red-600" />}
            footerLeft="No Condonation Possible"
            footerRight="Ordinance 14(B)"
            footerRightColor="error"
          />
        </div>

        {/* Tabular Roster with Debarment Filter */}
        <DataTable
          data={filteredStudents}
          columns={columns}
          searchPlaceholder="Search student by name, roll number, or department..."
          searchKey="name"
          pageSize={10}
          isLoading={isLoading}
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={selectedDebarmentFilter}
                onChange={(e) => setSelectedDebarmentFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Debarment Statuses</option>
                <option value="ELIGIBLE">Eligible (≥75%)</option>
                <option value="CONDONATION">At-Risk Condonation (65-74%)</option>
                <option value="DEBARRED">Debarred (&lt;65%)</option>
              </select>
            </div>
          }
          exportFileName="jbit-student-debarment-roster"
        />
      </div>

      {/* Condonation Review Modal */}
      {selectedStudentForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-[#0B3B60]" />
                <h3 className="text-base font-bold text-slate-900 font-headline">
                  Attendance Condonation Review
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="font-bold text-sm text-slate-900">{selectedStudentForReview.name}</p>
                <p className="text-slate-500 font-mono">Roll: #{selectedStudentForReview.rollNumber} • {selectedStudentForReview.program}</p>
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200">
                  <span>Current Attendance:</span>
                  <span className="font-bold text-sm text-slate-900 font-tabular-nums">
                    {selectedStudentForReview.attendancePercent}% ({selectedStudentForReview.attendedClasses}/{selectedStudentForReview.conductedClasses} classes)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="font-semibold">UTU Ordinance 14(B) Assessment:</p>
                <p className="mt-1">
                  Students between 65.0% and 74.9% may be condoned by the Dean Academics upon verification of valid medical certificates or authorized university event On-Duty (OD) slips.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateDebarmentMutation.mutate({
                      studentId: selectedStudentForReview.id,
                      status: "DEBARRED",
                    })
                  }
                  className="px-3.5 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold"
                >
                  Debar &amp; Withhold
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateDebarmentMutation.mutate({
                      studentId: selectedStudentForReview.id,
                      status: "ELIGIBLE",
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Approve Condonation &amp; Release Hall Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
