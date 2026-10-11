"use client";

import { Bed, Building2, DoorOpen, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useHostelBeds, useHostels, type HostelBed } from "@/features/campus";
import { formatPercent, ratio } from "@/lib/format";

const columns: Column<HostelBed>[] = [
  {
    header: "Building & Room",
    accessorKey: "buildingName",
    sortable: true,
    cell: (b) => (
      <div>
        <span className="font-semibold text-slate-900 text-xs block">{b.buildingName}</span>
        <span className="text-xs text-slate-500">
          Room {b.roomNumber} · Floor {b.floor} · Bed {b.bedNumber}
        </span>
      </div>
    ),
  },
  {
    header: "Occupant",
    accessorKey: "studentName",
    sortable: true,
    cell: (b) =>
      b.studentName ? (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{b.studentName}</span>
          <span className="text-xs text-slate-500 font-mono">
            #{b.studentRoll} · {b.studentBranch}
          </span>
        </div>
      ) : (
        <span className="text-xs text-slate-400 italic">Vacant</span>
      ),
  },
  {
    header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: (b) => <Badge variant={b.status === "OCCUPIED" ? "info" : "success"}>{b.status}</Badge>,
  },
];

/** Hostel allocation — shared by /hostel/dashboard and /admin/hostel. */
export function HostelScreen() {
  const hostels = useHostels();
  const beds = useHostelBeds();
  const list = beds.data ?? [];
  const occupied = list.filter((b) => b.status === "OCCUPIED").length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader breadcrumbs={["Campus Operations", "Hostels"]} title="Hostel Allocation" description="Buildings, rooms and bed occupancy." />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Buildings" value={hostels.data?.length ?? "—"} icon={<Building2 className="w-5 h-5" />} />
          <KpiCard title="Beds" value={list.length} icon={<Bed className="w-5 h-5" />} />
          <KpiCard
            title="Occupied"
            value={occupied}
            icon={<Users className="w-5 h-5" />}
            footerLeft={`${formatPercent(ratio(occupied, list.length))} occupancy`}
            footerRightColor="info"
          />
          <KpiCard title="Vacant" value={list.length - occupied} icon={<DoorOpen className="w-5 h-5 text-emerald-700" />} />
        </div>

        {beds.isError ? (
          <ErrorState error={beds.error} onRetry={() => beds.refetch()} />
        ) : (
          <DataTable data={list} columns={columns} searchPlaceholder="Search beds or students…" pageSize={12} isLoading={beds.isPending} exportFileName="jbit-hostel-beds" />
        )}
      </div>
    </DashboardLayout>
  );
}
