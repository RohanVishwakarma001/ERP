"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { operationsService } from "@/services/domain-services";
import { ComplaintTicket } from "@/types";
import { HelpCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default function ComplaintsPage() {
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints"],
    queryFn: operationsService.getComplaints,
  });

  const totalTickets = complaints.length;
  const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
  const pending = complaints.filter((c) => c.status === "OPEN" || c.status === "ASSIGNED").length;

  const columns: Column<ComplaintTicket>[] = [
    {
      header: "Ticket # & Title",
      accessorKey: "title",
      sortable: true,
      cell: (t) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block leading-tight">{t.title}</span>
          <span className="text-[11px] text-slate-500 font-mono">{t.ticketNumber} • {t.reportedBy} ({t.reportedByRole})</span>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (t) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
          {t.category}
        </span>
      ),
    },
    {
      header: "Assigned Specialist",
      accessorKey: "assignedTo",
      cell: (t) => <span className="text-xs text-slate-700">{t.assignedTo || "Unassigned"}</span>,
    },
    {
      header: "Created Date",
      accessorKey: "createdAt",
      sortable: true,
      cell: (t) => <span className="text-xs text-slate-500">{t.createdAt}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (t) => (
        <Badge
          variant={t.status === "RESOLVED" ? "success" : t.status === "IN_PROGRESS" ? "warning" : "error"}
          pulse={t.status === "IN_PROGRESS"}
        >
          {t.status}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Student Affairs</span>
            <span className="text-slate-300">•</span>
            <span className="text-[#0B3B60]">Grievance Desk</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
            Student &amp; Faculty Grievance Ticketing Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Omnichannel complaint resolution pipeline: Hostel amenities, laboratory hardware, transport schedules, and academic petitions.
          </p>
        </div>

        {/* 4 Grievance KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Tickets"
            value={totalTickets.toString()}
            unit="Filed"
            icon={<HelpCircle className="w-5 h-5 text-[#0B3B60]" />}
            footerLeft="Active Grievances"
            footerRight={`${totalTickets > 0 ? ((resolved / totalTickets) * 100).toFixed(0) : 100}% Resolution Rate`}
            footerRightColor="success"
          />
          <KpiCard
            title="In Progress"
            value={inProgress.toString()}
            unit="Active"
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            footerLeft="Assigned to Specialists"
            footerRight="SLA < 24h"
            footerRightColor="warning"
          />
          <KpiCard
            title="Resolved Tickets"
            value={resolved.toString()}
            unit="Closed"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            footerLeft="Action Completed"
            footerRight="Verified"
            footerRightColor="success"
          />
          <KpiCard
            title="Pending Intake"
            value={pending.toString()}
            unit="New"
            icon={<AlertTriangle className="w-5 h-5 text-indigo-600" />}
            footerLeft="Student & Faculty Desk"
            footerRight="Queue Active"
            footerRightColor="info"
          />
        </div>

        <DataTable
          data={complaints}
          columns={columns}
          searchPlaceholder="Search ticket title, category, or student..."
          searchKey="title"
          pageSize={10}
          isLoading={isLoading}
          exportFileName="jbit-grievances"
        />
      </div>
    </DashboardLayout>
  );
}
