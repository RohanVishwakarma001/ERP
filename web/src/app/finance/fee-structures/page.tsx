"use client";

import { useState, type FormEvent } from "react";
import { PlusCircle, Receipt, Send, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog, Modal, ModalActions } from "@/components/ui/modal";
import { Field, SelectInput, TextInput } from "@/components/ui/form-field";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { usePrograms } from "@/features/departments";
import { useAssignFeeStructure, useCreateFeeStructure, useDeleteFeeStructure, useFeeStructures, type FeeStructure } from "@/features/fees";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/lib/toast-store";

const COMPONENTS = [
  ["tuitionFee", "Tuition"],
  ["developmentFee", "Development"],
  ["labFee", "Laboratory"],
  ["libraryFee", "Library"],
  ["examFee", "Examination"],
] as const;

type ComponentKey = (typeof COMPONENTS)[number][0];

function currentAcademicYear() {
  const now = new Date();
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

function CreateStructureDialog({ onClose }: { onClose: () => void }) {
  const programs = usePrograms();
  const create = useCreateFeeStructure();
  const [form, setForm] = useState({
    programId: "",
    semester: "1",
    academicYear: currentAcademicYear(),
    tuitionFee: "",
    developmentFee: "",
    labFee: "",
    libraryFee: "",
    examFee: "",
  });
  const program = programs.data?.find((p) => p.id === form.programId);
  const total = COMPONENTS.reduce((n, [key]) => n + (Number(form[key]) || 0), 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const amounts = Object.fromEntries(COMPONENTS.map(([key]) => [key, Number(form[key]) || 0])) as Record<ComponentKey, number>;
    create.mutate(
      { programId: form.programId, semester: Number(form.semester), academicYear: form.academicYear, ...amounts },
      {
        onSuccess: () => {
          toast.success("Fee structure saved. Use “Bill students” to raise dues.");
          onClose();
        },
      },
    );
  };

  return (
    <Modal open onClose={onClose} title="New fee structure" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <Field label="Program">
              <SelectInput required value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
                <option value="">{programs.isPending ? "Loading…" : programs.data?.length ? "Choose a program" : "Add a program first"}</option>
                {programs.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.departmentCode})
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Semester">
            <TextInput required type="number" min={1} max={program?.totalSemesters ?? 12} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
          </Field>
          <Field label="Academic year">
            <TextInput required pattern="\d{4}-\d{4}" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
          </Field>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold text-slate-900 mb-3">Amounts (₹)</legend>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {COMPONENTS.map(([key, label]) => (
              <Field key={key} label={label} optional={key !== "tuitionFee"}>
                <TextInput
                  required={key === "tuitionFee"}
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Field>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-slate-700">
          Total per student: <strong className="font-tabular-nums">{formatCurrency(total)}</strong>
        </p>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending} disabled={total <= 0}>
            Save structure
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

function BillDialog({ structure, onClose }: { structure: FeeStructure; onClose: () => void }) {
  const assign = useAssignFeeStructure();
  const [dueDate, setDueDate] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    assign.mutate(
      { id: structure.id, dueDate },
      {
        onSuccess: (r) => {
          toast.success(
            r.eligible === 0
              ? "No students are currently in this program semester."
              : `${r.billed} student${r.billed === 1 ? "" : "s"} billed${r.alreadyBilled ? `, ${r.alreadyBilled} already had this fee` : ""}.`,
          );
          onClose();
        },
      },
    );
  };

  return (
    <Modal open onClose={onClose} title="Bill students" description={`${structure.programName} · semester ${structure.semester} · ${structure.academicYear}`}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-700">
          Every active student currently in semester {structure.semester} of {structure.programCode} is charged{" "}
          <strong>{formatCurrency(structure.totalAmount)}</strong>. Students already billed are skipped, so you can run this again after new admissions.
        </p>
        <Field label="Due date">
          <TextInput required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={assign.isPending}>
            Bill students
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export default function FeeStructuresPage() {
  const structures = useFeeStructures();
  const remove = useDeleteFeeStructure();
  const [creating, setCreating] = useState(false);
  const [billing, setBilling] = useState<FeeStructure | null>(null);
  const [deleting, setDeleting] = useState<FeeStructure | null>(null);

  const columns: Column<FeeStructure>[] = [
    {
      header: "Program",
      accessorKey: "programName",
      sortable: true,
      cell: (f) => (
        <div>
          <span className="font-semibold text-slate-900 block">{f.programName}</span>
          <span className="text-xs text-slate-500">
            {f.programCode} · Sem {f.semester} · {f.academicYear}
          </span>
        </div>
      ),
    },
    { header: "Per student", accessorKey: "totalAmount", sortable: true, cell: (f) => <span className="font-semibold font-tabular-nums">{formatCurrency(f.totalAmount)}</span> },
    { header: "Billed", accessorKey: "studentsBilled", sortable: true, cell: (f) => <span className="font-tabular-nums">{f.studentsBilled}</span> },
    { header: "Collected", accessorKey: "collected", sortable: true, cell: (f) => <span className="font-tabular-nums text-emerald-700">{formatCurrency(f.collected)}</span> },
    { header: "Outstanding", accessorKey: "outstanding", sortable: true, cell: (f) => <span className="font-tabular-nums text-amber-800">{formatCurrency(f.outstanding)}</span> },
    {
      header: "Actions",
      cell: (f) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="soft" icon={<Send className="w-4 h-4" />} onClick={() => setBilling(f)} aria-label={`Bill students for ${f.programCode} semester ${f.semester}`}>
            Bill students
          </Button>
          {f.studentsBilled === 0 && (
            <IconButton label={`Delete fee structure ${f.programCode} semester ${f.semester}`} onClick={() => setDeleting(f)} className="hover:text-red-700 hover:bg-red-50">
              <Trash2 className="w-4 h-4" aria-hidden />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Finance & Accounts", "Fee Structures"]}
          title="Fee structures"
          description="Define each program semester’s fee, then bill the students in it. Students see their dues and pay from their portal."
          actions={
            <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => setCreating(true)}>
              New fee structure
            </Button>
          }
        />
        {structures.isError ? (
          <ErrorState error={structures.error} onRetry={() => structures.refetch()} />
        ) : (
          <DataTable
            caption="Fee structures"
            data={structures.data ?? []}
            columns={columns}
            searchPlaceholder="Search programs…"
            isLoading={structures.isPending}
            emptyMessage="No fee structures yet"
            emptySubMessage="Create one for each program semester and academic year."
            exportFileName="jbit-fee-structures"
          />
        )}
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Receipt aria-hidden className="w-4 h-4" /> Record cash, cheque or bank payments from the Fee Ledger.
        </p>
      </div>

      {creating && <CreateStructureDialog onClose={() => setCreating(false)} />}
      {billing && <BillDialog key={billing.id} structure={billing} onClose={() => setBilling(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete fee structure?"
        message={`${deleting?.programName ?? ""} semester ${deleting?.semester ?? ""} (${deleting?.academicYear ?? ""}) will be removed. No students have been billed with it.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => toast.success("Fee structure deleted."), onSettled: () => setDeleting(null) })}
        onCancel={() => setDeleting(null)}
      />
    </DashboardLayout>
  );
}
