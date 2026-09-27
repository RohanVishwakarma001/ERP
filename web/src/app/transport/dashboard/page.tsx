"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { operationsService } from "@/services/domain-services";
import { TransportRoute } from "@/types";
import { Bus, MapPin, Users, CheckCircle2 } from "lucide-react";

export default function TransportDashboardPage() {
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["transportRoutes"],
    queryFn: operationsService.getTransportRoutes,
  });

  const totalBuses = routes.length;
  const totalCapacity = routes.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const totalOccupancy = routes.reduce((sum, r) => sum + (r.currentOccupancy || 0), 0);
  const activeRoutes = routes.filter((r) => r.status === "ON_ROUTE").length;

  const columns: Column<TransportRoute>[] = [
    {
      header: "Bus Vehicle & Fleet #",
      accessorKey: "busNumber",
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#0B3B60] flex items-center justify-center font-bold text-xs shrink-0">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block leading-tight">{r.busNumber}</span>
            <span className="text-[11px] text-slate-500 font-mono">Driver: {r.driverName} ({r.driverPhone})</span>
          </div>
        </div>
      ),
    },
    {
      header: "Route Path & Key Stops",
      accessorKey: "routeTitle",
      cell: (r) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">{r.routeTitle}</span>
          <span className="text-[10px] text-slate-500">{r.stops.slice(0, 3).join(" ➔ ")}...</span>
        </div>
      ),
    },
    {
      header: "Occupancy",
      cell: (r) => (
        <div className="text-xs font-tabular-nums">
          <span className="font-bold text-slate-800">{r.currentOccupancy} / {r.capacity} Seats</span>
          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${(r.currentOccupancy / r.capacity) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Live GPS Telematics",
      accessorKey: "currentLocation",
      cell: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{r.currentLocation}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (r) => (
        <Badge variant={r.status === "ON_ROUTE" ? "success" : "info"} pulse={r.status === "ON_ROUTE"}>
          {r.status === "ON_ROUTE" ? `En Route (${r.etaToCampusMinutes}m ETA)` : "At Campus"}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardLayout role="TRANSPORT_MANAGER">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Campus Telematics</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0B3B60]">Fleet Operations</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Campus Fleet Telematics, Bus Routes &amp; Tracking
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live GPS bus positioning, driver duty schedules, Dehradun metropolitan route timings, and student transport pass validations.
            </p>
          </div>
          <Badge variant="success">GPS Satellite Sync Active</Badge>
        </div>

        {/* 4 Transport KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Active Fleet"
            value={totalBuses.toString()}
            unit="Buses"
            icon={<Bus className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft={`${activeRoutes} En Route Now`}
            footerRight="100% On-Time"
            footerRightColor="success"
          />
          <KpiCard
            title="Transport Enrolled"
            value={totalOccupancy.toString()}
            unit="Students"
            icon={<Users className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft={`Fleet Capacity: ${totalCapacity}`}
            footerRight={`${totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : 0}% Occupancy`}
            footerRightColor="info"
          />
          <KpiCard
            title="Driver Staffing"
            value={totalBuses.toString()}
            unit="Drivers"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            footerLeft="Assigned to Routes"
            footerRight="Verified Licenses"
            footerRightColor="success"
          />
          <KpiCard
            title="Coverage Zone"
            value="45"
            unit="KM Radius"
            icon={<MapPin className="w-5 h-5 text-amber-600" />}
            footerLeft="Clock Tower, ISBT, Herbertpur"
            footerRight="GPS Monitored"
            footerRightColor="neutral"
          />
        </div>

        <DataTable
          data={routes}
          columns={columns}
          searchPlaceholder="Search by bus number, driver, or route stop..."
          searchKey="busNumber"
          pageSize={10}
          isLoading={isLoading}
          exportFileName="jbit-transport-fleet"
        />
      </div>
    </DashboardLayout>
  );
}
