"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { departmentService } from "@/services/domain-services";
import { GraduationCap, Award, BookOpen, Layers } from "lucide-react";

export default function CoursesPage() {
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentService.getDepartments,
  });

  const totalIntake = departments.reduce((sum, d) => sum + (d.intakeCapacity || 120), 0);
  const totalPrograms = departments.reduce((sum, d) => sum + (d.programs?.length || 1), 0);
  const nbaCount = departments.filter((d) => d.accreditationStatus?.includes("NBA")).length;

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Academic Affairs</span>
            <span className="text-slate-300">•</span>
            <span className="text-[#0B3B60]">Programs &amp; Degrees</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
            Institutional Programs, Curricula &amp; Affiliations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of degree offerings, syllabus versions, credit matrices, and AICTE/UTU approved intake quotas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Programs"
            value={totalPrograms.toString()}
            unit="Degrees"
            icon={<GraduationCap className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="UG, PG & Diploma"
            footerRight="100% Accredited"
            footerRightColor="success"
          />
          <KpiCard
            title="Total Approved Intake"
            value={totalIntake.toString()}
            unit="Seats / Yr"
            icon={<Layers className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="AICTE Affiliation Valid"
            footerRight="AY 2024-25"
            footerRightColor="info"
          />
          <KpiCard
            title="Active Syllabi"
            value="v2026"
            unit="NEP 2020"
            icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
            footerLeft="Outcome-Based Education"
            footerRight="OBE Aligned"
            footerRightColor="success"
          />
          <KpiCard
            title="Accredited Tier-1"
            value={nbaCount.toString()}
            unit="Depts"
            icon={<Award className="w-5 h-5 text-amber-600" />}
            footerLeft="NBA Certified"
            footerRight="Valid till 2027"
            footerRightColor="warning"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, idx) => (
            <div key={dept.id || idx} className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {dept.code}
                </span>
                <Badge variant={dept.accreditationStatus?.includes("NBA") ? "success" : "info"}>
                  {dept.accreditationStatus || "UTU Approved"}
                </Badge>
              </div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">{dept.name}</h3>
              <p className="text-xs text-slate-500">
                HOD: <strong className="text-slate-700">{dept.hodName}</strong> ({dept.building})
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{dept.programs?.join(", ") || "B.Tech"}</span>
                <span className="font-semibold text-slate-800 font-tabular-nums">
                  Intake: {dept.intakeCapacity || 120} seats
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
