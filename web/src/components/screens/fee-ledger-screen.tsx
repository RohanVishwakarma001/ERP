"use client";

import { AlertTriangle, CheckCircle2, IndianRupee, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useFeeLedger, type FeeLedgerRow, type FeeStatus } from "@/features/fees";
import { formatCurrency, formatDate, formatPercent, ratio } from "@/lib/format";

const STATUS_VARIANT: Record<FeeStatus, BadgeVariant> = { PAID: "success", PARTIAL: "info", PENDING: "warning", OVERDUE: "error" };

const columns: Column<FeeLedgerRow>[] = [
  {
    header: "Student",
    accessorKey: "studentName",
    sortable: true,
    cell: (r) => (
      <div>
        <span className="font-semibold text-slate-900 text-xs block">{r.studentName}</span>
        <span className="text-xs text-slate-500 font-mono">#{r.rollNumber}</span>
      </div>
    ),
  },
  {
    header: "Term",
    accessorKey: "semester",
    sortable: true,
    cell: (r) => (
      <span className="text-xs text-slate-600">
        Sem {r.semester} · {r.academicYear}
      </span>
    ),
  },
  {
    header: "Billed",
    accessorKey: "amountDue",
    sortable: true,
    cell: (r) => <span className="font-semibold text-xs text-slate-800 font-tabular-nums">{formatCurrency(r.amountDue)}</span>,
  },
  {
    header: "Paid",
    accessorKey: "amountPaid",
    sortable: true,
    cell: (r) => <span className="font-semibold text-xs text-emerald-700 font-tabular-nums">{formatCurrency(r.amountPaid)}</span>,
  },
  {
    header: "Due",
    accessorKey: "dueDate",
    sortable: true,
    cell: (r) => <span className="text-xs text-slate-600">{formatDate(r.dueDate)}</span>,
  },
  {
    header: "Last Payment",
    accessorKey: "lastPaymentDate",
    cell: (r) => (
      <div>
        <span className="text-xs text-slate-600 block">{formatDate(r.lastPaymentDate)}</span>
        {r.transactionRef && <span className="text-xs text-slate-400 font-mono">{r.transactionRef}</span>}
      </div>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    sortable: true,
    cell: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>,
  },
];

/** Finance ledger — shared by /finance/dashboard and /admin/fees. */
export function FeeLedgerScreen() {
  const ledger = useFeeLedger();
  const rows = ledger.data ?? [];
  const billed = rows.reduce((n, r) => n + r.amountDue, 0);
  const paid = rows.reduce((n, r) => n + r.amountPaid, 0);
  const pending = rows.reduce((n, r) => n + r.amountPending, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader breadcrumbs={["Finance & Accounts", "Fee Ledger"]} title="Fee Ledger" description="Every student fee account with billed, paid and outstanding amounts." />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Billed" value={formatCurrency(billed)} icon={<IndianRupee className="w-5 h-5" />} />
          <KpiCard
            title="Collected"
            value={formatCurrency(paid)}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
            footerLeft={`${formatPercent(ratio(paid, billed))} of billed`}
            footerRightColor="success"
          />
          <KpiCard title="Outstanding" value={formatCurrency(pending)} icon={<Wallet className="w-5 h-5 text-amber-700" />} />
          <KpiCard title="Overdue Accounts" value={rows.filter((r) => r.status === "OVERDUE").length} icon={<AlertTriangle className="w-5 h-5 text-red-700" />} />
        </div>

        {ledger.isError ? (
          <ErrorState error={ledger.error} onRetry={() => ledger.refetch()} />
        ) : (
          <DataTable data={rows} columns={columns} searchPlaceholder="Search students…" pageSize={10} isLoading={ledger.isPending} exportFileName="jbit-fee-ledger" />
        )}
      </div>
    </DashboardLayout>
  );
}
