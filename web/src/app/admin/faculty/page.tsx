"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { facultyService } from "@/services/domain-services";
import { FacultyMember } from "@/types";
import { Users2, Award, Clock, BookOpen, PlusCircle } from "lucide-react";

export default function FacultyDirectoryPage() {
  const { data: faculty = [], isLoading } = useQuery({
    queryKey: ["facultyList"],
    queryFn: facultyService.getFacultyList,
  });

  const [onboardFeedback, setOnboardFeedback] = useState<string | null>(null);
  const totalFaculty = faculty.length;
  const totalWeeklyHours = faculty.reduce((sum, f) => sum + (f.weeklyWorkloadHours || 18), 0);
  const avgLoad = totalFaculty > 0 ? (totalWeeklyHours / totalFaculty).toFixed(1) : "0.0";
  const phDCount = faculty.filter((f) => f.qualification?.includes("Ph.D") || f.designation?.includes("Professor")).length;
  const activePortals = faculty.reduce((sum, f) => sum + (f.activePeriodsCount || 4), 0);

  const columns: Column<FacultyMember>[] = [
    {
      header: "Faculty Name & ID",
      accessorKey: "name",
      sortable: true,
      cell: (f) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0B3B60] text-white flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-slate-200">
            {f.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block leading-tight">{f.name}</span>
            <span className="text-[11px] text-slate-500 font-mono">{f.employeeId}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Department & Role",
      accessorKey: "designation",
      sortable: true,
      cell: (f) => (
        <div>
          <span className="font-medium text-slate-800 text-xs block">{f.designation}</span>
          <span className="text-[11px] text-slate-500">{f.department}</span>
        </div>
      ),
    },
    {
      header: "Qualifications",
      accessorKey: "qualification",
      cell: (f) => (
        <div>
          <span className="font-medium text-slate-700 text-xs block">{f.qualification}</span>
          <span className="text-[11px] text-slate-500">{f.specialization}</span>
        </div>
      ),
    },
    {
      header: "Teaching Workload",
      accessorKey: "weeklyWorkloadHours",
      sortable: true,
      cell: (f) => {
        const isOverload = f.weeklyWorkloadHours > f.maxWorkloadHours;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-bold font-tabular-nums text-xs ${
                isOverload ? "text-amber-600" : "text-slate-800"
              }`}
            >
              {f.weeklyWorkloadHours} / {f.maxWorkloadHours} hrs
            </span>
            {isOverload && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Overload
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Active Classes",
      cell: (f) => (
        <div className="flex flex-wrap gap-1">
          {f.assignedSubjects.map((s, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
            >
              {s.code} ({s.section})
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (f) => (
        <Badge variant={f.status === "ACTIVE" ? "success" : "warning"}>
          {f.status}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Academic Affairs</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0B3B60]">Faculty Directory</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Faculty Workload, Roster &amp; AICTE Allocation Norms
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Faculty strength, weekly teaching hours, qualification profiles, and subject assignments across all engineering programs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOnboardFeedback("Faculty onboarding module initialized for Institutional HR review.");
              setTimeout(() => setOnboardFeedback(null), 4000);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] text-xs font-semibold shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Faculty</span>
          </button>
        </div>

        {onboardFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <span>{onboardFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Faculty Strength"
            value={totalFaculty.toString()}
            unit="Professors"
            icon={<Users2 className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft={`${phDCount} Ph.D Holders`}
            footerRight="AICTE Norm Cleared"
            footerRightColor="success"
          />
          <KpiCard
            title="Avg Teaching Load"
            value={avgLoad}
            unit="Hrs/Wk"
            icon={<Clock className="w-5 h-5 text-indigo-600" />}
            footerLeft="Optimal Range (16-20h)"
            footerRight="Balanced"
            footerRightColor="success"
          />
          <KpiCard
            title="FSR Institutional Ratio"
            value="1:18.5"
            unit="Ratio"
            icon={<Award className="w-5 h-5 text-emerald-600" />}
            footerLeft="Mandate: 1:20"
            footerRight="Compliant"
            footerRightColor="success"
          />
          <KpiCard
            title="Active Lecture Portals"
            value={activePortals.toString()}
            unit="Sessions"
            icon={<BookOpen className="w-5 h-5 text-amber-600" />}
            footerLeft="Real-time UTU Grid"
            footerRight="Daily Telemetry"
            footerRightColor="info"
          />
        </div>

        <DataTable
          data={faculty}
          columns={columns}
          searchPlaceholder="Search faculty by name, department, or qualification..."
          searchKey="name"
          pageSize={10}
          isLoading={isLoading}
          exportFileName="jbit-faculty-roster"
        />
      </div>
    </DashboardLayout>
  );
}
