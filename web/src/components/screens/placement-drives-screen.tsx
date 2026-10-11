"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { placementService } from "@/services/domain-services";
import { PlacementDrive } from "@/types";
import {
  Briefcase,
  Award,
  Wallet,
  Building,
  Mail,
  FileDown,
  CalendarPlus,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

export default function PlacementDashboardPage() {
  const { data: drives = [], isLoading } = useQuery({
    queryKey: ["placementDrives"],
    queryFn: placementService.getDrives,
  });

  const columns: Column<PlacementDrive>[] = [
    {
      header: "Corporate Partner & Role",
      accessorKey: "companyName",
      sortable: true,
      cell: (drive) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#EFF4FF] border border-[#DCE9FF] flex items-center justify-center font-bold text-xs text-[#0B3B60] shrink-0">
            {drive.companyName.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{drive.companyName}</span>
            <span className="text-[11px] text-slate-500">{drive.roleTitle}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Tier & Compensation",
      accessorKey: "ctc",
      sortable: true,
      cell: (drive) => (
        <div>
          <span className="font-bold text-emerald-700 block leading-tight font-tabular-nums">
            {drive.ctc}
          </span>
          <Badge
            variant={drive.tier === "Super Dream" ? "success" : "info"}
            className="mt-0.5 text-[9px]"
          >
            {drive.tier}
          </Badge>
        </div>
      ),
    },
    {
      header: "Eligibility Criterion",
      cell: (drive) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">
            Min CGPA ≥ {drive.minCgpa}
          </span>
          <span className="text-[11px] text-slate-500">
            0 Backlogs • {drive.eligibleBranches.slice(0, 2).join(", ")}
          </span>
        </div>
      ),
    },
    {
      header: "Funnel Cadre",
      cell: (drive) => (
        <div className="flex items-center gap-3 text-xs font-tabular-nums">
          <div>
            <span className="text-[10px] text-slate-400 block">Reg</span>
            <span className="font-semibold text-slate-800">{drive.registeredCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Short</span>
            <span className="font-semibold text-amber-600">{drive.shortlistedCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Offers</span>
            <span className="font-bold text-emerald-600">{drive.offersCount}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Drive Date & Deadline",
      accessorKey: "driveDate",
      sortable: true,
      cell: (drive) => (
        <div>
          <span className="font-medium text-slate-800 block leading-tight">{drive.driveDate}</span>
          <span className="text-[10px] text-red-600 font-semibold block">Closes: {drive.deadline}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (drive) => (
        <Badge
          variant={drive.status === "LIVE" ? "success" : drive.status === "UPCOMING" ? "info" : "neutral"}
          pulse={drive.status === "LIVE"}
        >
          {drive.status === "LIVE" ? "Live Drive" : drive.status}
        </Badge>
      ),
    },
  ];

  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);
  const totalRegistered = drives.reduce((sum, d) => sum + (d.registeredCount || 0), 0);
  const totalOffers = drives.reduce((sum, d) => sum + (d.offersCount || 0), 0);
  const liveDrives = drives.filter((d) => d.status === "LIVE").length;
  const totalCompanies = drives.length;

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        {/* Top Header matching Stitch Placement Console */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Academic Affairs</span>
              <span className="text-slate-300">/</span>
              <span>Corporate Relations</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#0B3B60]">Training &amp; Placement Cell (TPC)</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline">
                TPC — Corporate Relations &amp; Campus Drive Command Center
              </h1>
              <Badge variant="success">NIRF Metric 5.2 Active</Badge>
            </div>
            <p className="text-xs text-slate-500 max-w-4xl mt-0.5">
              Manage campus recruitment drives, company tier allocations, student eligibility criteria, live interview rounds, offer letters, and NIRF/NAAC placement audit telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Drive Tracker ({liveDrives} Ongoing)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDispatchFeedback("Shortlist dossier successfully dispatched to corporate recruitment portals.");
                setTimeout(() => setDispatchFeedback(null), 4000);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Bulk Shortlist Dispatch</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-slate-500" />
              <span>Export Placement Gazette</span>
            </button>
          </div>
        </div>

        {dispatchFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <span>{dispatchFeedback}</span>
          </div>
        )}

        {/* 4 Recruitment KPI Cards matching Stitch UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Registered Cadre"
            value={totalRegistered.toString()}
            unit="Candidates"
            icon={<Briefcase className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Eligible Candidates Cleared"
            footerRight="100% Verified"
            footerRightColor="success"
          />
          <KpiCard
            title="Placement Conversion"
            value={`${totalOffers} Offers`}
            unit="Total"
            icon={<Award className="w-5 h-5 text-emerald-600" />}
            footerLeft="Across Campus Recruitment"
            footerRight="NIRF Aligned"
            footerRightColor="success"
          />
          <KpiCard
            title="CTC Compensation Ceiling"
            value="₹44.0"
            unit="LPA Max"
            icon={<Wallet className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Tier-1 Recruitment Active"
            footerRight="Verified Offers"
            footerRightColor="info"
          />
          <KpiCard
            title="Corporate Partners"
            value={totalCompanies.toString()}
            unit="Partners"
            icon={<Building className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="MNCs & Tech Unicorns"
            footerRight={`${liveDrives} Active Drives`}
            footerRightColor="success"
          />
        </div>

        {/* Tabular Recruitment Drives Ledger */}
        <DataTable
          data={drives}
          columns={columns}
          searchPlaceholder="Search company, role title, or branch (e.g. AWS, Microsoft, CSE)..."
          searchKey="companyName"
          pageSize={10}
          isLoading={isLoading}
          exportFileName="jbit-placement-drives-telemetry"
        />
      </div>
    </DashboardLayout>
  );
}
