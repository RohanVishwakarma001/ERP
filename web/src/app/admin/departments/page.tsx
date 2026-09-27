"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "@/services/domain-services";
import { Department } from "@/types";
import {
  Building2,
  Users,
  GraduationCap,
  Award,
  PlusCircle,
  Printer,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newHodName, setNewHodName] = useState("");
  const [selectedAccreditation, setSelectedAccreditation] = useState<string>("All");

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentService.getDepartments,
  });

  const addMutation = useMutation({
    mutationFn: departmentService.addDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsAddModalOpen(false);
      setNewDeptName("");
      setNewDeptCode("");
      setNewHodName("");
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    addMutation.mutate({
      name: newDeptName,
      code: newDeptCode,
      hodName: newHodName || "Appointed HOD",
    });
  };

  const filteredDepts = departments.filter((d) => {
    if (selectedAccreditation === "All") return true;
    return d.accreditationStatus.includes(selectedAccreditation);
  });

  const columns: Column<Department>[] = [
    {
      header: "Department / Program Units",
      accessorKey: "name",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#0B3B60] font-bold text-xs flex items-center justify-center shrink-0">
            {item.code}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block leading-tight">{item.name}</span>
            <span className="text-[11px] text-slate-500">{item.programs.join(", ")}</span>
          </div>
        </div>
      ),
    },
    {
      header: "HOD & Leadership",
      accessorKey: "hodName",
      sortable: true,
      cell: (item) => (
        <div>
          <span className="font-medium text-slate-800 block leading-tight">{item.hodName}</span>
          <span className="text-[11px] text-slate-400 font-mono">{item.hodEmail}</span>
        </div>
      ),
    },
    {
      header: "Enrolled Cadre",
      accessorKey: "studentCount",
      sortable: true,
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 font-tabular-nums">{item.studentCount}</span>
          <span className="text-[11px] text-slate-500 block">Intake: {item.intakeCapacity}</span>
        </div>
      ),
    },
    {
      header: "Faculty Strength",
      accessorKey: "facultyCount",
      sortable: true,
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 font-tabular-nums">{item.facultyCount}</span>
          <span className="text-[11px] text-slate-500 block">FSR {item.fsrRatio}</span>
        </div>
      ),
    },
    {
      header: "Accreditation",
      accessorKey: "accreditationStatus",
      sortable: true,
      cell: (item) => {
        const variant =
          item.accreditationStatus === "NBA Tier-1"
            ? "success"
            : item.accreditationStatus === "NAAC A+"
            ? "info"
            : "warning";
        return (
          <Badge variant={variant} pulse={item.accreditationStatus === "NBA Tier-1"}>
            {item.accreditationStatus}
          </Badge>
        );
      },
    },
    {
      header: "Avg Attendance",
      accessorKey: "averageAttendance",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                item.averageAttendance >= 80 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${item.averageAttendance}%` }}
            />
          </div>
          <span className="font-bold text-xs text-slate-700 font-tabular-nums">
            {item.averageAttendance}%
          </span>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        {/* Top Context Header matching Stitch UI */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Academic Affairs</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0B3B60]">Departmental Operations &amp; Workload</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Department Academic &amp; Faculty Workload Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
              Oversee academic departments, NBA/NAAC accreditation metrics, faculty-to-student ratios, program curricula, and departmental performance ledgers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-[#E2E8F0] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#0B3B60]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase leading-tight">
                  Compliance Node
                </span>
                <span className="text-xs font-bold text-slate-800">UTU &amp; AICTE 2024-25</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Summary Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Department</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Active Academic Units"
            value="8"
            unit="Departments"
            icon={<Building2 className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="100% UTU Affiliated"
            footerRight="Good Standing"
            footerRightColor="success"
          />
          <KpiCard
            title="Total Enrolled Cadre"
            value="2,840"
            unit="Students"
            icon={<Users className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="UG & PG Degree Programs"
            footerRight="+6.4% YoY Intake"
            footerRightColor="success"
          />
          <KpiCard
            title="Faculty Staff Strength"
            value="148"
            unit="Full-Time"
            icon={<GraduationCap className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="42 Ph.D Holders"
            footerRight="FSR 1:19.2 (AICTE Norm 1:20)"
            footerRightColor="info"
          />
          <KpiCard
            title="NBA Tier-1 Programs"
            value="4"
            unit="Departments"
            icon={<Award className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="CSE, ME, ECE, CE"
            footerRight="Audit Q4 2025"
            footerRightColor="warning"
          />
        </div>

        {/* Tabular Data View */}
        <DataTable
          data={filteredDepts}
          columns={columns}
          searchPlaceholder="Search by department name, HOD, or code (e.g. CSE, Bhatt)..."
          searchKey="name"
          pageSize={10}
          isLoading={isLoading}
          filterComponent={
            <div className="flex items-center gap-2">
              <select
                value={selectedAccreditation}
                onChange={(e) => setSelectedAccreditation(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="All">All Accreditations</option>
                <option value="NBA">NBA Tier-1</option>
                <option value="NAAC">NAAC A+</option>
              </select>
            </div>
          }
          exportFileName="jbit-departments-workload"
        />
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-slate-900 font-headline">Add Academic Department</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-800 bg-[#F8FAFC] focus:outline-none focus:border-[#0B3B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-DS"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-800 bg-[#F8FAFC] focus:outline-none focus:border-[#0B3B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Head of Department (HOD)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Preeti Varma"
                  value={newHodName}
                  onChange={(e) => setNewHodName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-800 bg-[#F8FAFC] focus:outline-none focus:border-[#0B3B60]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-[#0B3B60] text-white text-xs font-semibold hover:bg-[#082C49] shadow-xs cursor-pointer"
                >
                  {addMutation.isPending ? "Creating..." : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
