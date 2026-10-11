"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileBadge, ShieldAlert, Users, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/form-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { useExamCycles } from "@/features/exams";
import {
  useApproveAdmitCards,
  useDownloadAdmitCard,
  useExamCandidates,
  useRevokeAdmitCard,
  type AdmitCardCandidate,
  type ApproveResult,
} from "@/features/admit-cards";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { toast } from "@/lib/toast-store";

type Filter = "ready" | "blocked" | "approved" | "all";

const isApproved = (c: AdmitCardCandidate) => c.admitCard?.status === "APPROVED";
const isReady = (c: AdmitCardCandidate) => !isApproved(c) && c.blockers.length === 0;
const isBlocked = (c: AdmitCardCandidate) => !isApproved(c) && c.blockers.length > 0;

function FeeCell({ c }: { c: AdmitCardCandidate }) {
  if (!c.fees.billed) return <Badge variant="neutral">Not billed</Badge>;
  if (c.fees.cleared) return <Badge variant="success">Cleared</Badge>;
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="font-semibold text-sm text-red-700 font-tabular-nums">{formatCurrency(c.fees.pending)} due</span>
      {c.fees.overdue && <span className="text-xs text-red-700">Overdue</span>}
    </span>
  );
}

function CardCell({ c, onRevoke }: { c: AdmitCardCandidate; onRevoke: () => void }) {
  const download = useDownloadAdmitCard();
  const card = c.admitCard;
  if (!card) return <span className="text-xs text-slate-500">Not reviewed</span>;
  if (card.status === "REVOKED") {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <Badge variant="error">Revoked</Badge>
        {card.remarks && <span className="text-xs text-slate-500 max-w-48">{card.remarks}</span>}
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-1 items-start">
      <span className="inline-flex items-center gap-1.5">
        <Badge variant="success">Approved</Badge>
        {card.overridden && <Badge variant="warning">Override</Badge>}
      </span>
      <span className="text-xs text-slate-500">
        {card.cardNumber} · {formatDate(card.approvedAt)}
      </span>
      {card.overridden && card.remarks && <span className="text-xs text-amber-800 max-w-56">{card.remarks}</span>}
      <span className="flex gap-1">
        <Button size="sm" variant="ghost" loading={download.isPending} onClick={() => download.mutate({ id: card.id, rollNumber: `admit-card-${c.rollNumber}` })} aria-label={`Download admit card of ${c.name}`}>
          PDF
        </Button>
        <Button size="sm" variant="ghost" onClick={onRevoke} aria-label={`Revoke admit card of ${c.name}`} className="text-red-700">
          Revoke
        </Button>
      </span>
    </div>
  );
}

export default function AdmitCardsPage() {
  const exams = useExamCycles();
  const [examId, setExamId] = useState<string>("");
  const candidates = useExamCandidates(examId || null);
  const approve = useApproveAdmitCards();
  const revoke = useRevokeAdmitCard();

  const [filter, setFilter] = useState<Filter>("ready");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [result, setResult] = useState<ApproveResult | null>(null);
  const [revoking, setRevoking] = useState<AdmitCardCandidate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const all = useMemo(() => candidates.data?.candidates ?? [], [candidates.data]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((c) => (filter === "ready" ? isReady(c) : filter === "blocked" ? isBlocked(c) : filter === "approved" ? isApproved(c) : true))
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.rollNumber.toLowerCase().includes(q));
  }, [all, filter, search]);

  const selectable = shown.filter((c) => !isApproved(c));
  const selectedRows = all.filter((c) => selected.has(c.studentId));
  const selectedBlocked = selectedRows.filter((c) => c.blockers.length > 0);
  const allShownSelected = selectable.length > 0 && selectable.every((c) => selected.has(c.studentId));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) selectable.forEach((c) => next.delete(c.studentId));
      else selectable.forEach((c) => next.add(c.studentId));
      return next;
    });

  const changeExam = (id: string) => {
    setExamId(id);
    setSelected(new Set());
    setResult(null);
  };

  const runApprove = (withOverride: boolean) => {
    approve.mutate(
      { examId, studentIds: [...selected], overrideReason: withOverride ? overrideReason : undefined },
      {
        onSuccess: (r) => {
          setResult(r);
          setSelected(new Set());
          setConfirming(false);
          setOverrideReason("");
          if (r.approved) toast.success(`${r.approved} admit card${r.approved === 1 ? "" : "s"} approved.`);
        },
      },
    );
  };

  const runRevoke = () => {
    if (!revoking?.admitCard) return;
    revoke.mutate(
      { id: revoking.admitCard.id, reason: revokeReason },
      {
        onSuccess: () => {
          toast.success(`Admit card of ${revoking.name} revoked.`);
          setRevoking(null);
          setRevokeReason("");
        },
      },
    );
  };

  const counts = {
    ready: all.filter(isReady).length,
    blocked: all.filter(isBlocked).length,
    approved: all.filter(isApproved).length,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Examinations", "Admit Cards"]}
          title="Admit cards"
          description="Verify each student’s fee status and attendance, then approve their admit card. Students download it once approved."
        />

        <div className="w-full sm:w-96">
          <Field label="Exam">
            <SelectInput value={examId} onChange={(e) => changeExam(e.target.value)} disabled={!exams.data?.length}>
              <option value="">{exams.isPending ? "Loading…" : exams.data?.length ? "Choose an exam" : "No exams yet — create one under Exam Seating & COE"}</option>
              {exams.data?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.session}) · {e.totalPapers} papers
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {!examId ? (
          <EmptyState icon={<FileBadge />} title="Choose an exam" description="Candidates are students whose program and semester have at least one paper in the exam." />
        ) : candidates.isPending ? (
          <LoadingState label="Loading candidates…" />
        ) : candidates.isError ? (
          <ErrorState error={candidates.error} onRetry={() => candidates.refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard title="Candidates" value={all.length} icon={<Users className="w-5 h-5" />} />
              <KpiCard title="Ready to approve" value={counts.ready} icon={<CheckCircle2 className="w-5 h-5" />} />
              <KpiCard title="Dues or debarred" value={counts.blocked} icon={<Wallet className="w-5 h-5" />} />
              <KpiCard title="Approved" value={counts.approved} icon={<FileBadge className="w-5 h-5" />} />
            </div>

            {result && result.skipped.length > 0 && (
              <div role="status" className="p-4 rounded-2xl bg-amber-50 text-sm text-amber-900">
                <p className="font-semibold flex items-center gap-2">
                  <ShieldAlert aria-hidden className="w-4 h-4" /> {result.skipped.length} not approved
                </p>
                <ul className="mt-2 space-y-1 list-disc pl-5">
                  {result.skipped.map((s) => (
                    <li key={s.studentId}>
                      <span className="font-medium">{s.name ?? s.studentId}</span>: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
              <SegmentedControl
                label="Filter candidates"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "ready", label: `Ready (${counts.ready})` },
                  { value: "blocked", label: `Needs attention (${counts.blocked})` },
                  { value: "approved", label: `Approved (${counts.approved})` },
                  { value: "all", label: "All" },
                ]}
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="sm:w-64">
                  <Field label="Search">
                    <TextInput type="search" placeholder="Name or roll number" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </Field>
                </div>
                <Button disabled={selected.size === 0} onClick={() => setConfirming(true)}>
                  Approve selected ({selected.size})
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white">
              <table className="w-full text-sm min-w-[760px]">
                <caption className="sr-only">Admit card candidates</caption>
                <thead className="text-left text-xs text-slate-500 bg-slate-50">
                  <tr>
                    <th scope="col" className="p-3 w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary-container"
                        checked={allShownSelected}
                        onChange={toggleAll}
                        disabled={selectable.length === 0}
                        aria-label="Select all shown students"
                      />
                    </th>
                    <th scope="col" className="p-3 font-medium">Student</th>
                    <th scope="col" className="p-3 font-medium">Program</th>
                    <th scope="col" className="p-3 font-medium">Fees</th>
                    <th scope="col" className="p-3 font-medium">Attendance</th>
                    <th scope="col" className="p-3 font-medium">Admit card</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No students in this view.
                      </td>
                    </tr>
                  ) : (
                    shown.map((c) => (
                      <tr key={c.studentId} className="border-t border-surface-subtle align-top">
                        <td className="p-3">
                          {!isApproved(c) && (
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary-container"
                              checked={selected.has(c.studentId)}
                              onChange={() => toggle(c.studentId)}
                              aria-label={`Select ${c.name}`}
                            />
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 block">{c.name}</span>
                          <span className="text-xs text-slate-500 font-mono">{c.rollNumber}</span>
                        </td>
                        <td className="p-3 text-slate-700">
                          {c.program} · Sem {c.semester}
                          {c.section && <span className="block text-xs text-slate-500">{c.section}</span>}
                        </td>
                        <td className="p-3">
                          <FeeCell c={c} />
                        </td>
                        <td className="p-3">
                          <span className="font-tabular-nums">{formatPercent(c.attendance)}</span>
                          {c.isDebarred && (
                            <span className="block mt-0.5">
                              <Badge variant="error">Debarred</Badge>
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <CardCell c={c} onRevoke={() => setRevoking(c)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Approve ${selected.size} admit card${selected.size === 1 ? "" : "s"}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={approve.isPending}>
              Cancel
            </Button>
            {selectedBlocked.length > 0 && (
              <Button variant="soft" loading={approve.isPending} disabled={overrideReason.trim().length < 5} onClick={() => runApprove(true)}>
                Approve all with override
              </Button>
            )}
            <Button loading={approve.isPending} onClick={() => runApprove(false)} disabled={selectedBlocked.length === selected.size}>
              {selectedBlocked.length ? `Approve ${selected.size - selectedBlocked.length} cleared` : "Approve"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-slate-700">
          <p>Students will be able to download their admit card immediately.</p>
          {selectedBlocked.length > 0 && (
            <>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-900">
                <p className="font-semibold">{selectedBlocked.length} selected student(s) have outstanding fees or are debarred:</p>
                <ul className="mt-1 list-disc pl-5">
                  {selectedBlocked.slice(0, 8).map((c) => (
                    <li key={c.studentId}>
                      {c.name} — {[!c.fees.cleared && `${formatCurrency(c.fees.pending)} due`, c.isDebarred && "debarred"].filter(Boolean).join(", ")}
                    </li>
                  ))}
                  {selectedBlocked.length > 8 && <li>and {selectedBlocked.length - 8} more</li>}
                </ul>
                <p className="mt-2">They’ll be skipped unless you approve with an override and record why.</p>
              </div>
              <Field label="Override reason" hint="Recorded on each overridden admit card and in the audit log." optional>
                <TextArea maxLength={300} placeholder="e.g. Instalment plan approved by the Registrar" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
              </Field>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        title="Revoke admit card?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevoking(null)} disabled={revoke.isPending}>
              Cancel
            </Button>
            <Button variant="danger" loading={revoke.isPending} disabled={!revokeReason.trim()} onClick={runRevoke}>
              Revoke
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>{revoking?.name} will no longer be able to download this admit card. You can approve it again later.</p>
          <Field label="Reason" hint="Shown to the student.">
            <TextInput required maxLength={300} value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
