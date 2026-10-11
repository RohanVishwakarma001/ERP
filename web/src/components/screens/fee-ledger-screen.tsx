"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, IndianRupee, Receipt, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Button, buttonClasses } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field, SelectInput, TextInput } from "@/components/ui/form-field";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { OFFLINE_PAYMENT_MODES, useFeeLedger, useRecordPayment, type FeeLedgerRow, type FeeStatus, type OfflinePaymentMode } from "@/features/fees";
import { toast } from "@/lib/toast-store";
import { formatCurrency, formatDate, formatPercent, ratio } from "@/lib/format";

const STATUS_VARIANT: Record<FeeStatus, BadgeVariant> = { PAID: "success", PARTIAL: "info", PENDING: "warning", OVERDUE: "error" };

const MODE_LABELS: Record<OfflinePaymentMode, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  DEMAND_DRAFT: "Demand draft",
  BANK_TRANSFER: "Bank transfer (NEFT/RTGS)",
  UPI: "UPI",
};

function RecordPaymentDialog({ row, onClose }: { row: FeeLedgerRow; onClose: () => void }) {
  const record = useRecordPayment();
  const [form, setForm] = useState({ amount: String(row.amountPending), mode: "CASH" as OfflinePaymentMode, reference: "" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    record.mutate(
      { accountId: row.id, amount: Number(form.amount), mode: form.mode, reference: form.reference || undefined },
      {
        onSuccess: (r) => {
          toast.success(`Payment recorded. Receipt ${r.receiptNumber}.`);
          onClose();
        },
      },
    );
  };

  return (
    <Modal open onClose={onClose} title="Record payment" description={`${row.studentName} · ${row.rollNumber} · Sem ${row.semester} (${row.academicYear})`}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-700">
          Outstanding: <strong className="font-tabular-nums">{formatCurrency(row.amountPending)}</strong>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Amount (₹)">
            <TextInput required type="number" min={1} max={row.amountPending} step="0.01" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Mode">
            <SelectInput value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as OfflinePaymentMode })}>
              {OFFLINE_PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Reference" optional hint="Cheque / DD number, UTR or UPI reference">
          <TextInput maxLength={60} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </Field>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={record.isPending}>
            Record payment
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

const baseColumns: Column<FeeLedgerRow>[] = [
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
  const [paying, setPaying] = useState<FeeLedgerRow | null>(null);
  const columns: Column<FeeLedgerRow>[] = [
    ...baseColumns,
    {
      header: "Actions",
      cell: (r) =>
        r.amountPending > 0 ? (
          <Button size="sm" variant="soft" onClick={() => setPaying(r)} aria-label={`Record payment for ${r.studentName}`}>
            Record payment
          </Button>
        ) : null,
    },
  ];
  const rows = ledger.data ?? [];
  const billed = rows.reduce((n, r) => n + r.amountDue, 0);
  const paid = rows.reduce((n, r) => n + r.amountPaid, 0);
  const pending = rows.reduce((n, r) => n + r.amountPending, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Finance & Accounts", "Fee Ledger"]}
          title="Fee Ledger"
          description="Every student fee account with billed, paid and outstanding amounts. Record payments received at the accounts office."
          actions={
            <Link href="/finance/fee-structures" className={buttonClasses("secondary")}>
              <Receipt aria-hidden className="w-4 h-4" /> Fee structures
            </Link>
          }
        />

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
          <DataTable
            data={rows}
            columns={columns}
            searchPlaceholder="Search students…"
            pageSize={10}
            isLoading={ledger.isPending}
            emptyMessage="No fee accounts yet"
            emptySubMessage="Create a fee structure and bill the students in it."
            exportFileName="jbit-fee-ledger"
          />
        )}
      </div>
      {paying && <RecordPaymentDialog key={paying.id} row={paying} onClose={() => setPaying(null)} />}
    </DashboardLayout>
  );
}
