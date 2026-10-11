"use client";

import { Bus, MapPin, Route, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useTransportRoutes, type BusRoute } from "@/features/campus";
import { ratio } from "@/lib/format";

const columns: Column<BusRoute>[] = [
  {
    header: "Bus",
    accessorKey: "busNumber",
    sortable: true,
    cell: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary-container flex items-center justify-center shrink-0">
          <Bus className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-slate-900 text-xs block leading-tight">{r.busNumber}</span>
          <span className="text-xs text-slate-500">
            {r.driverName} · {r.driverPhone}
          </span>
        </div>
      </div>
    ),
  },
  {
    header: "Route",
    accessorKey: "routeTitle",
    sortable: true,
    cell: (r) => (
      <div>
        <span className="text-xs font-semibold text-slate-800 block">
          {r.routeNumber}: {r.routeTitle}
        </span>
        <span className="text-xs text-slate-500">
          Departs {r.departureTime} · {r.stops.join(" → ")}
        </span>
      </div>
    ),
  },
  {
    header: "Pass Holders",
    accessorKey: "passHolders",
    sortable: true,
    cell: (r) => (
      <div className="w-28 text-xs font-tabular-nums">
        <span className="font-semibold text-slate-800">
          {r.passHolders} / {r.capacity}
        </span>
        <ProgressBar value={ratio(r.passHolders, r.capacity) ?? 0} tone={r.passHolders > r.capacity ? "error" : "success"} className="mt-1" />
      </div>
    ),
  },
  {
    header: "GPS",
    accessorKey: "status",
    sortable: true,
    cell: (r) =>
      r.currentPosition ? (
        <Badge variant="success">Live</Badge>
      ) : (
        <Badge variant="neutral">No signal</Badge>
      ),
  },
];

/** Fleet overview — shared by /transport/dashboard and /admin/transport. */
export function TransportScreen() {
  const routes = useTransportRoutes();
  const list = routes.data ?? [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader breadcrumbs={["Campus Operations", "Transport"]} title="Fleet & Transport" description="Buses, routes, assigned pass holders and GPS status." />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Buses" value={list.length} icon={<Bus className="w-5 h-5" />} />
          <KpiCard title="Routes" value={new Set(list.map((r) => r.routeNumber)).size} icon={<Route className="w-5 h-5" />} />
          <KpiCard title="Pass Holders" value={list.reduce((n, r) => n + r.passHolders, 0)} icon={<Users className="w-5 h-5" />} />
          <KpiCard title="Live GPS" value={list.filter((r) => r.currentPosition).length} unit={`of ${list.length}`} icon={<MapPin className="w-5 h-5" />} />
        </div>

        {routes.isError ? (
          <ErrorState error={routes.error} onRetry={() => routes.refetch()} />
        ) : (
          <DataTable data={list} columns={columns} searchPlaceholder="Search buses or routes…" pageSize={10} isLoading={routes.isPending} exportFileName="jbit-fleet" />
        )}
      </div>
    </DashboardLayout>
  );
}
