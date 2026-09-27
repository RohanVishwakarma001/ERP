"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { feeService, studentService } from "@/services/domain-services";
import { FeeLedgerItem } from "@/types";
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileDown,
  CreditCard,
  Building,
} from "lucide-react";

export default function FinanceDashboardPage() {
  const { data: fees = [], isLoading } = useQuery({
    queryKey: ["feeLedger"],
    queryFn: feeService.getFeeLedger,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: studentService.getStudents,
  });

  const totalDue = fees.reduce((sum, f) => sum + (f.amountDue || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const pendingDues = Math.max(0, totalDue - totalPaid);
  const paidCount = fees.filter((f) => f.status === "PAID").length;
  const pendingCount = fees.filter((f) => f.status === "PENDING" || f.status === "OVERDUE").length;

  const columns: Column<FeeLedgerItem>[] = [
    {
      header: "Fee Category",
      accessorKey: "category",
      sortable: true,
      cell: (item) => (
        <span className="font-bold text-slate-900 text-xs">{item.category}</span>
      ),
    },
    {
      header: "Due Date",
      accessorKey: "dueDate",
      sortable: true,
      cell: (item) => <span className="text-xs text-slate-600">{item.dueDate}</span>,
    },
    {
      header: "Amount Due",
      accessorKey: "amountDue",
      sortable: true,
      cell: (item) => (
        <span className="font-bold text-xs text-slate-800 font-tabular-nums">
          ₹{item.amountDue.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Amount Paid",
      accessorKey: "amountPaid",
      sortable: true,
      cell: (item) => (
        <span className="font-bold text-xs text-emerald-700 font-tabular-nums">
          ₹{item.amountPaid.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (item) => (
        <Badge variant={item.status === "PAID" ? "success" : "warning"}>
          {item.status}
        </Badge>
      ),
    },
    {
      header: "Challan / Ref #",
      accessorKey: "transactionRef",
      cell: (item) => (
        <span className="font-mono text-[11px] text-slate-500">{item.transactionRef || "—"}</span>
      ),
    },
  ];

  return (
    <DashboardLayout role="ACCOUNTANT">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Financial Affairs</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700">Accounts &amp; Fee Ledger</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Finance &amp; Tuition Fee Collection Console
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Semester fee schedules, challan generation, online Razorpay webhook ledger, scholarship reconciliations, and defaulters notice issuance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-xs font-semibold shadow-2xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-slate-500" />
              <span>Export Reconciliation Sheet</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Fee Ledger"
            value={`₹${(totalDue / 100000).toFixed(1)}`}
            unit="Lakhs"
            icon={<Wallet className="w-5 h-5 text-emerald-700" />}
            footerLeft="AY 2024-26 Term"
            footerRight={`${fees.length} Total Invoices`}
            footerRightColor="neutral"
          />
          <KpiCard
            title="Collected Collections"
            value={`₹${(totalPaid / 100000).toFixed(1)}`}
            unit="Lakhs"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            footerLeft={`${paidCount} Clearances`}
            footerRight={`${totalDue > 0 ? ((totalPaid / totalDue) * 100).toFixed(1) : 0}% Realized`}
            footerRightColor="success"
          />
          <KpiCard
            title="Pending Dues"
            value={`₹${(pendingDues / 100000).toFixed(1)}`}
            unit="Lakhs"
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            footerLeft={`${pendingCount} Pending Accounts`}
            footerRight="Follow-up Active"
            footerRightColor="warning"
          />
          <KpiCard
            title="Total Student Enrollees"
            value={students.length.toString()}
            unit="Candidates"
            icon={<Building className="w-5 h-5 text-indigo-600" />}
            footerLeft="Verified Student Accounts"
            footerRight="Finance Reconciled"
            footerRightColor="info"
          />
        </div>

        {/* Fee Structures Ledger */}
        <DataTable
          data={fees}
          columns={columns}
          searchPlaceholder="Search category or transaction ref..."
          searchKey="category"
          pageSize={10}
          isLoading={isLoading}
          exportFileName="jbit-finance-fee-ledger"
        />
      </div>
    </DashboardLayout>
  );
}
