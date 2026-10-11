"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field, SelectInput, TextInput } from "@/components/ui/form-field";
import { useCurriculum } from "@/features/departments";
import { useAddExamPaper, useCreateExam, type ExamCycle } from "@/features/exams";
import { toast } from "@/lib/toast-store";

/** Indian academic years start in July. */
function currentAcademicYear() {
  const now = new Date();
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

/** "14:30" (from <input type="time">) → "02:30 PM", the format the timetable uses. */
function toClock(value: string) {
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function CreateExamDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateExam();
  const [form, setForm] = useState({ title: "", cycle: "", academicYear: currentAcademicYear() });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => {
        toast.success(`${form.title} created. Add its papers next.`);
        onClose();
      },
    });
  };

  return (
    <Modal open onClose={onClose} title="New exam">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <TextInput required maxLength={160} placeholder="e.g. End-Semester Examinations, Odd Semester 2026" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cycle code" hint="Printed on admit cards, e.g. ODD_2026">
            <TextInput required pattern="[A-Za-z0-9_\-]{2,30}" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Academic year">
            <TextInput required pattern="\d{4}-\d{4}" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
          </Field>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create exam
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export function AddPaperDialog({ exam, onClose }: { exam: ExamCycle; onClose: () => void }) {
  const add = useAddExamPaper();
  const courses = useCurriculum();
  const [form, setForm] = useState({ subjectId: "", date: "", start: "09:30", end: "12:30", maxMarks: "100" });
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.end <= form.start) return setError("The paper must end after it starts.");
    setError(undefined);
    add.mutate(
      { examId: exam.id, subjectId: form.subjectId, date: form.date, startTime: toClock(form.start), endTime: toClock(form.end), maxMarks: Number(form.maxMarks) },
      {
        onSuccess: () => {
          toast.success("Paper added.");
          setForm((f) => ({ ...f, subjectId: "" }));
        },
      },
    );
  };

  return (
    <Modal open onClose={onClose} title="Add paper" description={exam.name}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Course">
          <SelectInput required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} disabled={!courses.data?.length}>
            <option value="">{courses.isPending ? "Loading…" : courses.data?.length ? "Choose a course" : "Add courses under Programs & Courses first"}</option>
            {courses.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name} ({c.program}, sem {c.semester})
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Field label="Date">
              <TextInput required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
          </div>
          <Field label="Starts" error={error}>
            <TextInput required type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </Field>
          <Field label="Ends">
            <TextInput required type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </Field>
          <Field label="Max marks">
            <TextInput required type="number" min={1} max={500} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
          </Field>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
          <Button type="submit" loading={add.isPending}>
            Add paper
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
