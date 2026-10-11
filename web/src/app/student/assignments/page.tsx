"use client";

import { useRef, useState } from "react";
import { ClipboardList, Download, Paperclip, Upload } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonClasses, Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { QueryState } from "@/components/ui/query-state";
import { useAssignments, useSubmitAssignment, type Assignment } from "@/features/assignments";
import { UPLOAD_ACCEPT, UPLOAD_HINT, useUploadFile } from "@/features/uploads";
import { getErrorMessage } from "@/lib/api/api-error";
import { toast } from "@/lib/toast-store";

type Filter = "due" | "submitted" | "all";

const STATE: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Not submitted", variant: "warning" },
  SUBMITTED: { label: "Submitted", variant: "info" },
  RESUBMITTED: { label: "Resubmitted", variant: "info" },
  LATE: { label: "Submitted late", variant: "warning" },
  EVALUATED: { label: "Graded", variant: "success" },
};

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function AssignmentCard({ a }: { a: Assignment }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useUploadFile("assignments");
  const submit = useSubmitAssignment();
  const [error, setError] = useState<string>();

  const state = STATE[a.mySubmissionStatus ?? "PENDING"] ?? STATE.PENDING;
  const pastDeadline = new Date(a.deadline) < new Date();
  const canSubmit = a.status === "PUBLISHED" && !pastDeadline && a.mySubmissionStatus !== "EVALUATED";
  const busy = upload.isPending || submit.isPending;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(undefined);
    try {
      const uploaded = await upload.mutateAsync(file);
      await submit.mutateAsync({ id: a.id, fileUrl: uploaded.url });
      toast.success(`Submitted “${a.title}”.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <article className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">
            <span className="font-mono">{a.subjectCode}</span> · {a.subjectName}
          </p>
          <h2 className="text-[15px] font-semibold text-slate-900 leading-snug mt-0.5">{a.title}</h2>
        </div>
        <Badge variant={state.variant}>{state.label}</Badge>
      </div>

      <p className="text-sm text-slate-700 whitespace-pre-line">{a.description}</p>

      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        <div>
          <dt className="inline text-slate-500">Due </dt>
          <dd className={`inline font-medium ${pastDeadline ? "text-red-700" : "text-slate-800"}`}>{formatDeadline(a.deadline)}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">Marks </dt>
          <dd className="inline font-medium text-slate-800">{a.myMarks !== null ? `${a.myMarks} / ${a.maxMarks}` : `out of ${a.maxMarks}`}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">Set by </dt>
          <dd className="inline">{a.faculty}</dd>
        </div>
      </dl>

      {a.myFeedback && (
        <p className="text-sm bg-emerald-50 text-emerald-900 rounded-xl px-3 py-2">
          <span className="font-semibold">Feedback: </span>
          {a.myFeedback}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm bg-red-50 text-red-800 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {a.attachmentUrl ? (
          <a href={a.attachmentUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "sm")}>
            <Download aria-hidden className="w-4 h-4" /> Download brief
          </a>
        ) : (
          <span className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Paperclip aria-hidden className="w-3.5 h-3.5" /> No attachment — instructions above
          </span>
        )}
        {canSubmit && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept={UPLOAD_ACCEPT}
              className="sr-only"
              id={`file-${a.id}`}
              onChange={(e) => onFile(e.target.files?.[0])}
              aria-describedby={`hint-${a.id}`}
            />
            <Button size="sm" icon={<Upload className="w-4 h-4" />} loading={busy} onClick={() => fileInput.current?.click()}>
              {a.mySubmissionStatus && a.mySubmissionStatus !== "PENDING" ? "Replace submission" : "Upload & submit"}
            </Button>
            <span id={`hint-${a.id}`} className="text-xs text-slate-500">
              {UPLOAD_HINT}
            </span>
          </>
        )}
        {!canSubmit && a.mySubmissionStatus === "PENDING" && (
          <span className="text-xs text-red-700">{a.status === "CLOSED" ? "Submissions are closed." : "The deadline has passed."}</span>
        )}
      </div>
    </article>
  );
}

export default function StudentAssignmentsPage() {
  const assignments = useAssignments();
  const [filter, setFilter] = useState<Filter>("due");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <PageHeader title="Assignments" description="Work set for your section. Download the brief, then upload your submission before the deadline." />
        <SegmentedControl
          label="Filter assignments"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "due", label: "To do" },
            { value: "submitted", label: "Submitted" },
            { value: "all", label: "All" },
          ]}
        />
        <QueryState
          query={assignments}
          empty={{ title: "No assignments yet", description: "Assignments your teachers set for your section will appear here.", icon: <ClipboardList /> }}
        >
          {(list) => {
            const shown = list.filter((a) =>
              filter === "all" ? true : filter === "due" ? a.mySubmissionStatus === "PENDING" : a.mySubmissionStatus !== "PENDING",
            );
            return shown.length ? (
              <div className="flex flex-col gap-4">
                {shown.map((a) => (
                  <AssignmentCard key={a.id} a={a} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-10">{filter === "due" ? "You’re all caught up." : "Nothing here yet."}</p>
            );
          }}
        </QueryState>
      </div>
    </DashboardLayout>
  );
}
