"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Checkbox, Field, TextInput } from "@/components/ui/form-field";
import { useCreateDepartment, useUpdateDepartment, type Department } from "@/features/departments";
import { toast } from "@/lib/toast-store";

/** null `department` = create. Mount with `key` = department id so the form resets per department. */
export function DepartmentDialog({ open, onClose, department }: { open: boolean; onClose: () => void; department: Department | null }) {
  const create = useCreateDepartment();
  const update = useUpdateDepartment();
  const [form, setForm] = useState(() => ({
    name: department?.name ?? "",
    code: department?.code ?? "",
    building: department?.building ?? "",
    nbaAccredited: department?.nbaAccredited ?? false,
  }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const onSuccess = () => {
      toast.success(department ? `${form.name} updated.` : `${form.name} created.`);
      onClose();
    };
    if (department) update.mutate({ id: department.id, ...form }, { onSuccess });
    else create.mutate(form, { onSuccess });
  };

  return (
    <Modal open={open} onClose={onClose} title={department ? "Edit department" : "Add department"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Department name">
          <TextInput
            required
            maxLength={120}
            placeholder="e.g. Artificial Intelligence & Data Science"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Code" hint="2–10 letters or digits, e.g. AIDS">
            <TextInput
              required
              pattern="[A-Za-z0-9]{2,10}"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Building">
            <TextInput required maxLength={120} placeholder="e.g. Block A" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
          </Field>
        </div>
        <Checkbox
          label="NBA accredited"
          checked={form.nbaAccredited}
          onChange={(e) => setForm({ ...form, nbaAccredited: e.target.checked })}
        />
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {department ? "Save changes" : "Save department"}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
