"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field, TextInput } from "@/components/ui/form-field";
import { useCreateSection, useUpdateSection, type Section } from "@/features/departments";
import { toast } from "@/lib/toast-store";

/** Indian academic years start in July. */
function currentAcademicYear() {
  const now = new Date();
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

/** null `section` = create. Mount with `key` = section id so the form resets per section. */
export function SectionDialog({ open, onClose, section }: { open: boolean; onClose: () => void; section: Section | null }) {
  const create = useCreateSection();
  const update = useUpdateSection();
  const [form, setForm] = useState(() => ({
    name: section?.name ?? "",
    semester: String(section?.semester ?? 1),
    academicYear: section?.academicYear ?? currentAcademicYear(),
    capacity: String(section?.capacity ?? 60),
  }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { ...form, semester: Number(form.semester), capacity: Number(form.capacity) };
    const label = form.name.trim().toUpperCase();
    const onSuccess = () => {
      toast.success(section ? `Section ${label} updated.` : `Section ${label} added.`);
      onClose();
    };
    if (section) update.mutate({ id: section.id, ...input }, { onSuccess });
    else create.mutate(input, { onSuccess });
  };

  return (
    <Modal open={open} onClose={onClose} title={section ? "Edit section" : "Add section"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Section name" hint="e.g. CSE-1A">
          <TextInput
            required
            maxLength={30}
            pattern="[A-Za-z0-9][A-Za-z0-9 _\-]{0,29}"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Semester">
            <TextInput required type="number" min={1} max={12} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
          </Field>
          <Field label="Academic year">
            <TextInput
              required
              pattern="\d{4}-\d{4}"
              placeholder="2026-2027"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            />
          </Field>
          <Field label="Capacity" hint={section?.studentCount ? `${section.studentCount} enrolled` : undefined}>
            <TextInput
              required
              type="number"
              min={Math.max(1, section?.studentCount ?? 1)}
              max={500}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </Field>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {section ? "Save changes" : "Save section"}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
