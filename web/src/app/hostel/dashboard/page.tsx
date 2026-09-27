"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { operationsService } from "@/services/domain-services";
import { HostelBedAllocation } from "@/types";
import { Bed, Users, ShieldAlert, CheckCircle } from "lucide-react";

export default function HostelDashboardPage() {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["hostelRooms"],
    queryFn: operationsService.getHostelRooms,
  });

  const totalBeds = rooms.length;
  const occupiedBeds = rooms.filter((r) => r.status === "OCCUPIED").length;
  const vacantBeds = rooms.filter((r) => r.status === "VACANT").length;
  const occupancyPercent = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : "0.0";

  const columns: Column<HostelBedAllocation>[] = [
    {
      header: "Building Block & Room",
      accessorKey: "buildingName",
      sortable: true,
      cell: (r) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{r.buildingName}</span>
          <span className="text-[11px] text-slate-500">Room #{r.roomNumber} • Floor {r.floor} • Bed {r.bedNumber}</span>
        </div>
      ),
    },
    {
      header: "Allocated Student",
      cell: (r) =>
        r.studentName ? (
          <div>
            <span className="font-semibold text-slate-900 text-xs block">{r.studentName}</span>
            <span className="text-[11px] text-slate-500 font-mono">Roll: #{r.studentRoll}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">No Student Allocated</span>
        ),
    },
    {
      header: "Warden In-Charge",
      accessorKey: "wardenName",
      cell: (r) => <span className="text-xs text-slate-700">{r.wardenName}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (r) => (
        <Badge variant={r.status === "OCCUPIED" ? "info" : "success"}>
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardLayout role="HOSTEL_WARDEN">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Campus Residential</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0B3B60]">Hostel Administration</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Hostel Building, Bed Allocation &amp; Digital Outpass Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student residential blocks (Himalayan Boys &amp; Shivalik Girls), room inventory, mess dues, and biometric/QR security outpass verifications.
            </p>
          </div>
          <Badge variant="primary">Campus Residential Active</Badge>
        </div>

        {/* 4 Hostel KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Bed Capacity"
            value={totalBeds.toString()}
            unit="Beds"
            icon={<Bed className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Residential Inventory"
            footerRight={`${occupancyPercent}% Occupied`}
            footerRightColor="success"
          />
          <KpiCard
            title="Resident Inmates"
            value={occupiedBeds.toString()}
            unit="Students"
            icon={<Users className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Active Resident Allocations"
            footerRight="100% KYC Verified"
            footerRightColor="info"
          />
          <KpiCard
            title="Vacant Beds"
            value={vacantBeds.toString()}
            unit="Available"
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            footerLeft="Ready for Allotment"
            footerRight="Verified Ready"
            footerRightColor="neutral"
          />
          <KpiCard
            title="Active Buildings"
            value="4 Blocks"
            unit="Active"
            icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
            footerLeft="Boys & Girls Hostels"
            footerRight="Biometric Guarded"
            footerRightColor="success"
          />
        </div>

        <DataTable
          data={rooms}
          columns={columns}
          searchPlaceholder="Search by student name, roll number, or building..."
          searchKey="buildingName"
          pageSize={10}
          isLoading={isLoading}
          exportFileName="jbit-hostel-allocations"
        />
      </div>
    </DashboardLayout>
  );
}
