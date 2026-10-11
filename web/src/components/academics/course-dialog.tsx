"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field, SelectInput, TextInput } from "@/components/ui/form-field";
import { SUBJECT_TYPES, useCreateSubject, useUpdateSubject, type CurriculumSubject, type Program, type SubjectType } from "@/features/departments";
import { toast } from "@/lib/toast-store";

export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  THEORY: "Theory",
  PRACTICAL: "Practical / Lab",
  HYBRID: "Theory + Lab",
};

interface CourseDialogProps {
  open: boolean;
  onClose: () => void;
  /** null = create. Mount with `key` = course id so the form resets per course. */
  course: CurriculumSubject | null;
  /** Programs the user may add courses to. */
  programs: Program[];
}

export function CourseDialog({ open, onClose, course, programs }: CourseDialogProps) {
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const [form, setForm] = useState(() => ({
    code: course?.code ?? "",
    name: course?.name ?? "",
    credits: String(course?.credits ?? 4),
    semester: String(course?.semester ?? 1),
    type: course?.type ?? ("THEORY" as SubjectType),
    programId: course?.programId ?? (programs.length === 1 ? programs[0].id : ""),
  }));

  const program = programs.find((p) => p.id === form.programId);
  const maxSemester = program?.totalSemesters ?? 12;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const fields = { code: form.code, name: form.name, credits: Number(form.credits), semester: Number(form.semester), type: form.type };
    const onSuccess = () => {
      toast.success(course ? `${fields.code.toUpperCase()} updated.` : `${fields.code.toUpperCase()} added.`);
      onClose();
    };
    if (course) update.mutate({ id: course.id, ...fields }, { onSuccess });
    else create.mutate({ ...fields, programId: form.programId }, { onSuccess });
  };

  return (
    <Modal open={open} onClose={onClose} title={course ? "Edit course" : "Add course"}>
      <form onSubmit={submit} className="space-y-4">
        {course ? (
          <Field label="Program" hint="A course can't move to another program.">
            <TextInput readOnly disabled value={`${course.program} · ${course.department}`} />
          </Field>
        ) : (
          <Field label="Program">
            <SelectInput required value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
              <option value="">{programs.length ? "Choose a program" : "Add a program first"}</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.departmentCode})
                </option>
              ))}
            </SelectInput>
          </Field>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
          <Field label="Course code">
            <TextInput
              required
              maxLength={20}
              pattern="[A-Za-z0-9][A-Za-z0-9 _\-]{1,19}"
              placeholder="e.g. CS-601"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Course name">
            <TextInput required maxLength={160} placeholder="e.g. Compiler Design" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Semester" hint={program ? `1–${maxSemester}` : undefined}>
            <TextInput
              required
              type="number"
              min={1}
              max={course ? 12 : maxSemester}
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            />
          </Field>
          <Field label="Credits">
            <TextInput required type="number" min={0} max={10} value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
          </Field>
          <Field label="Type">
            <SelectInput value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SubjectType })}>
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SUBJECT_TYPE_LABELS[t]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending} disabled={!course && !programs.length}>
            {course ? "Save changes" : "Save course"}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
