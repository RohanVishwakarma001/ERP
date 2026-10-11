"use client";

import { useRef, useState, type FormEvent } from "react";
import { ClipboardList, Download, ExternalLink, Lock, PlusCircle, Upload, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { ConfirmDialog, Modal, ModalActions } from "@/components/ui/modal";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/form-field";
import { LoadingState, ErrorState, QueryState } from "@/components/ui/query-state";
import { useAuth } from "@/features/auth";
import { useCurriculum, useSections } from "@/features/departments";
import {
  useAssignments,
  useAssignmentSubmissions,
  useCloseAssignment,
  useCreateAssignment,
  useGradeSubmission,
  type Assignment,
  type AssignmentSubmissions,
} from "@/features/assignments";
import { UPLOAD_ACCEPT, UPLOAD_HINT, useUploadFile } from "@/features/uploads";
import { getErrorMessage } from "@/lib/api/api-error";
import { toast } from "@/lib/toast-store";

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function CreateAssignmentDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const courses = useCurriculum();
  const sections = useSections();
  const create = useCreateAssignment();
  const upload = useUploadFile("assignments");
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({ subjectId: "", sectionId: "", title: "", description: "", deadline: "", maxMarks: "20" });

  const ownCourses = (courses.data ?? []).filter((c) => c.departmentId === user?.departmentId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      const attachmentUrl = file ? (await upload.mutateAsync(file)).url : undefined;
      await create.mutateAsync({
        subjectId: form.subjectId,
        sectionId: form.sectionId,
        title: form.title,
        description: form.description,
        // datetime-local has no zone; the campus runs on IST.
        deadline: `${form.deadline}:00+05:30`,
        maxMarks: Number(form.maxMarks),
        attachmentUrl,
      });
      toast.success(`“${form.title}” published to the section.`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title="New assignment" size="lg">
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="text-sm bg-red-50 text-red-800 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Course">
            <SelectInput required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">{courses.isPending ? "Loading…" : ownCourses.length ? "Choose a course" : "No courses in your department yet"}</option>
              {ownCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name} (sem {c.semester})
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Section">
            <SelectInput required value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
              <option value="">{sections.isPending ? "Loading…" : "Choose a section"}</option>
              {sections.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · Sem {s.semester} · {s.academicYear}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Title">
          <TextInput required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Instructions">
          <TextArea required maxLength={5000} rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Deadline (IST)">
            <TextInput required type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <Field label="Maximum marks">
            <TextInput required type="number" min={1} max={200} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
          </Field>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 mb-1.5">
            Attachment <span className="text-xs font-normal text-slate-500">· optional</span>
          </p>
          <input ref={fileInput} type="file" accept={UPLOAD_ACCEPT} className="sr-only" id="assignment-file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => fileInput.current?.click()} aria-describedby="assignment-file-hint">
              {file ? "Change file" : "Choose file"}
            </Button>
            <span id="assignment-file-hint" className="text-xs text-slate-500">
              {file ? file.name : `Question paper or brief students can download. ${UPLOAD_HINT}`}
            </span>
          </div>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={upload.isPending || create.isPending} disabled={!ownCourses.length}>
            Publish assignment
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

function GradeRow({ assignmentId, maxMarks, row }: { assignmentId: string; maxMarks: number; row: AssignmentSubmissions["students"][number] }) {
  const grade = useGradeSubmission();
  const sub = row.submission;
  const [marks, setMarks] = useState(sub?.marksObtained?.toString() ?? "");
  const [feedback, setFeedback] = useState(sub?.feedback ?? "");

  const save = (e: FormEvent) => {
    e.preventDefault();
    grade.mutate(
      { id: assignmentId, studentId: row.studentId, marksObtained: Number(marks), feedback: feedback || undefined },
      { onSuccess: () => toast.success(`Marks saved for ${row.name}.`) },
    );
  };

  return (
    <tr className="border-t border-surface-subtle align-top">
      <td className="p-3">
        <span className="font-medium text-slate-900 block">{row.name}</span>
        <span className="text-xs text-slate-500 font-mono">{row.rollNumber}</span>
      </td>
      <td className="p-3">
        {sub ? (
          <span className="flex flex-col gap-1 items-start">
            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-container font-medium inline-flex items-center gap-1 hover:underline">
              Open file <ExternalLink aria-hidden className="w-3.5 h-3.5" />
            </a>
            <span className="text-xs text-slate-500">
              {formatDeadline(sub.submittedAt)} {sub.late && <Badge variant="warning">Late</Badge>}
            </span>
          </span>
        ) : (
          <Badge variant="neutral">Not submitted</Badge>
        )}
      </td>
      <td className="p-3">
        {sub && (
          <form onSubmit={save} className="flex flex-wrap items-start gap-2">
            <TextInput
              required
              type="number"
              min={0}
              max={maxMarks}
              step="0.5"
              aria-label={`Marks for ${row.name} out of ${maxMarks}`}
              className="!w-20"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
            />
            <TextInput aria-label={`Feedback for ${row.name}`} placeholder="Feedback (optional)" maxLength={2000} className="!w-56" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <Button type="submit" size="sm" variant={sub.status === "EVALUATED" ? "secondary" : "primary"} loading={grade.isPending}>
              {sub.status === "EVALUATED" ? "Update" : "Save"}
            </Button>
          </form>
        )}
      </td>
    </tr>
  );
}

function SubmissionsDialog({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const submissions = useAssignmentSubmissions(assignment.id);
  return (
    <Modal open onClose={onClose} title={assignment.title} description={`${assignment.subjectCode} · ${assignment.section} · out of ${assignment.maxMarks}`} size="xl">
      {submissions.isPending ? (
        <LoadingState label="Loading submissions…" />
      ) : submissions.isError ? (
        <ErrorState error={submissions.error} onRetry={() => submissions.refetch()} />
      ) : submissions.data.students.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">No students are enrolled in this section yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[640px]">
            <caption className="sr-only">Submissions for {assignment.title}</caption>
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th scope="col" className="p-3 font-medium">Student</th>
                <th scope="col" className="p-3 font-medium">Submission</th>
                <th scope="col" className="p-3 font-medium">Marks &amp; feedback</th>
              </tr>
            </thead>
            <tbody>
              {submissions.data.students.map((row) => (
                <GradeRow key={row.studentId} assignmentId={assignment.id} maxMarks={assignment.maxMarks} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

export default function FacultyAssignmentsPage() {
  const assignments = useAssignments();
  const close = useCloseAssignment();
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Assignment | null>(null);
  const [closing, setClosing] = useState<Assignment | null>(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Teaching", "Assignments"]}
          title="Assignments"
          description="Set work for a section, attach the brief, then review and grade submissions."
          actions={
            <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => setCreating(true)}>
              New assignment
            </Button>
          }
        />
        <QueryState query={assignments} empty={{ title: "No assignments yet", description: "Assignments you set will appear here.", icon: <ClipboardList /> }}>
          {(list) => (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {list.map((a) => (
                <article key={a.id} className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        <span className="font-mono">{a.subjectCode}</span> · {a.section}
                      </p>
                      <h2 className="text-[15px] font-semibold text-slate-900 leading-snug mt-0.5">{a.title}</h2>
                    </div>
                    <Badge variant={a.status === "PUBLISHED" ? "success" : "neutral"}>{a.status === "PUBLISHED" ? "Open" : "Closed"}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-line">{a.description}</p>
                  <p className="text-xs text-slate-600">
                    Due {formatDeadline(a.deadline)} · {a.maxMarks} marks ·{" "}
                    <strong>
                      {a.submissionsCount}/{a.totalStudents}
                    </strong>{" "}
                    submitted
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" icon={<Users className="w-4 h-4" />} onClick={() => setViewing(a)}>
                      Submissions
                    </Button>
                    {a.attachmentUrl && (
                      <a href={a.attachmentUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "sm")}>
                        <Download aria-hidden className="w-4 h-4" /> Brief
                      </a>
                    )}
                    {a.status === "PUBLISHED" && (
                      <Button size="sm" variant="ghost" icon={<Lock className="w-4 h-4" />} onClick={() => setClosing(a)}>
                        Close submissions
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </QueryState>
      </div>

      {creating && <CreateAssignmentDialog onClose={() => setCreating(false)} />}
      {viewing && <SubmissionsDialog key={viewing.id} assignment={viewing} onClose={() => setViewing(null)} />}
      <ConfirmDialog
        open={closing !== null}
        title="Close submissions?"
        message={`Students will no longer be able to submit “${closing?.title ?? ""}”. Existing submissions stay and can still be graded.`}
        confirmLabel="Close submissions"
        loading={close.isPending}
        onConfirm={() => closing && close.mutate(closing.id, { onSuccess: () => toast.success("Submissions closed."), onSettled: () => setClosing(null) })}
        onCancel={() => setClosing(null)}
      />
    </DashboardLayout>
  );
}
