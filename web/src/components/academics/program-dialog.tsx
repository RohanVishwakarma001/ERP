"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field, SelectInput, TextInput } from "@/components/ui/form-field";
import { DEGREE_TYPES, useCreateProgram, useUpdateProgram, type Department, type DegreeType, type Program } from "@/features/departments";
import { toast } from "@/lib/toast-store";

export const DEGREE_LABELS: Record<DegreeType, string> = {
  DIPLOMA: "Diploma",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  DOCTORAL: "Doctoral",
};

interface ProgramDialogProps {
  open: boolean;
  onClose: () => void;
  /** null = create. Mount with `key` = program id so the form resets per program. */
  program: Program | null;
  /** Departments the user may add programs to. */
  departments: Department[];
}

export function ProgramDialog({ open, onClose, program, departments }: ProgramDialogProps) {
  const create = useCreateProgram();
  const update = useUpdateProgram();
  const [form, setForm] = useState(() => ({
    name: program?.name ?? "",
    code: program?.code ?? "",
    departmentId: program?.departmentId ?? (departments.length === 1 ? departments[0].id : ""),
    durationYears: String(program?.durationYears ?? 4),
    totalSemesters: String(program?.totalSemesters ?? 8),
    degreeType: program?.degreeType ?? ("UNDERGRADUATE" as DegreeType),
  }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const fields = {
      name: form.name,
      code: form.code,
      durationYears: Number(form.durationYears),
      totalSemesters: Number(form.totalSemesters),
      degreeType: form.degreeType,
    };
    const onSuccess = () => {
      toast.success(program ? `${form.name} updated.` : `${form.name} added.`);
      onClose();
    };
    if (program) update.mutate({ id: program.id, ...fields }, { onSuccess });
    else create.mutate({ ...fields, departmentId: form.departmentId }, { onSuccess });
  };

  return (
    <Modal open={open} onClose={onClose} title={program ? "Edit program" : "Add program"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Program name">
          <TextInput
            required
            maxLength={160}
            placeholder="e.g. B.Tech Computer Science & Engineering"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Code" hint="Letters, digits or _, e.g. BTECH_CSE">
            <TextInput
              required
              pattern="[A-Za-z0-9_]{2,20}"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </Field>
          {program ? (
            <Field label="Department" hint="A program can't move to another department.">
              <TextInput readOnly disabled value={program.departmentCode} />
            </Field>
          ) : (
            <Field label="Department">
              <SelectInput required value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">{departments.length ? "Choose a department" : "Add a department first"}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
          <Field label="Level">
            <SelectInput value={form.degreeType} onChange={(e) => setForm({ ...form, degreeType: e.target.value as DegreeType })}>
              {DEGREE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DEGREE_LABELS[t]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Years">
              <TextInput
                required
                type="number"
                min={1}
                max={6}
                value={form.durationYears}
                onChange={(e) => setForm({ ...form, durationYears: e.target.value })}
              />
            </Field>
            <Field label="Semesters">
              <TextInput
                required
                type="number"
                min={1}
                max={12}
                value={form.totalSemesters}
                onChange={(e) => setForm({ ...form, totalSemesters: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending} disabled={!program && !departments.length}>
            {program ? "Save changes" : "Save program"}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
