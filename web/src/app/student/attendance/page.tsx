"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, FileCheck, MapPin, QrCode, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Stat, StatGrid, WelcomePanel } from "@/components/ui/welcome-panel";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/form-field";
import { QueryState } from "@/components/ui/query-state";
import {
  ATTENDANCE_THRESHOLD,
  attendanceBadgeVariant,
  attendanceTone,
  getCurrentLocation,
  useCreatePetition,
  useMyPetitions,
  useMySubjectAttendance,
  useQrScanner,
  useScanQr,
  type AttendancePetition,
  type CreatePetitionInput,
} from "@/features/attendance";
import { getErrorMessage } from "@/lib/api/api-error";
import { formatDate, formatPercent } from "@/lib/format";
import { toast } from "@/lib/toast-store";

type Tab = "overview" | "scan" | "petitions";

const PETITION_VARIANT: Record<AttendancePetition["status"], BadgeVariant> = { PENDING: "warning", APPROVED: "success", REJECTED: "error" };

export default function StudentAttendancePage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <PageHeader title="Attendance" description="Your attendance by subject, QR check-in, and correction petitions." />
        <SegmentedControl<Tab>
          label="Attendance views"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "scan", label: "Scan QR", icon: <QrCode className="w-4 h-4" /> },
            { value: "petitions", label: "Petitions", icon: <FileCheck className="w-4 h-4" /> },
          ]}
        />
        {tab === "overview" && <OverviewTab />}
        {tab === "scan" && <ScanTab />}
        {tab === "petitions" && <PetitionsTab />}
      </div>
    </DashboardLayout>
  );
}

function OverviewTab() {
  const attendance = useMySubjectAttendance();
  return (
    <QueryState query={attendance} empty={{ title: "No attendance recorded yet", description: "Your classes will appear here once attendance is taken." }}>
      {(subjects) => {
        const conducted = subjects.reduce((n, s) => n + s.conducted, 0);
        const attended = subjects.reduce((n, s) => n + s.attended, 0);
        const overall = conducted ? (attended / conducted) * 100 : 0;
        return (
          <div className="space-y-6">
            <WelcomePanel
              headingLevel={2}
              eyebrow="Overall attendance"
              title={formatPercent(overall)}
              subtitle={`Minimum ${ATTENDANCE_THRESHOLD}% is required for end-term hall tickets (UTU Ordinance 14(B)).`}
            >
              <StatGrid columns={3}>
                <Stat label="Classes conducted" value={conducted} />
                <Stat label="Classes attended" value={attended} />
                <Stat
                  label="Status"
                  value={overall >= ATTENDANCE_THRESHOLD ? "On track" : "At risk"}
                  tone={overall >= ATTENDANCE_THRESHOLD ? "success" : "error"}
                />
              </StatGrid>
            </WelcomePanel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((s) => (
                <div key={s.subjectCode} className="p-5 rounded-2xl border border-border-subtle bg-white shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 leading-tight">{s.subjectName}</h3>
                      <p className="text-xs text-slate-500">
                        {s.subjectCode} · {s.facultyName}
                      </p>
                    </div>
                    <Badge variant={attendanceBadgeVariant(s.percentage)}>{s.status}</Badge>
                  </div>
                  <div className="flex items-baseline justify-between text-xs pt-1">
                    <span className="text-slate-500">
                      {s.attended} / {s.conducted} attended
                    </span>
                    <span className="font-semibold font-tabular-nums text-slate-800">{formatPercent(s.percentage)}</span>
                  </div>
                  <ProgressBar value={s.percentage} tone={attendanceTone(s.percentage)} size="md" />
                  {s.requiredToReach75 > 0 && (
                    <p className="text-xs text-amber-700">
                      Attend the next {s.requiredToReach75} classes to reach {ATTENDANCE_THRESHOLD}%.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}

function ScanTab() {
  const scanQr = useScanQr();
  const { phase, error: cameraError, start, videoRef, canvasRef } = useQrScanner(async (token) => {
    scanQr.mutate({ token, location: await getCurrentLocation() });
  });

  const busy = phase === "requesting-camera" || phase === "scanning" || scanQr.isPending;
  const error = cameraError ?? (scanQr.isError ? getErrorMessage(scanQr.error) : null);

  return (
    <div className="p-6 sm:p-8 rounded-2xl border border-border-subtle bg-white shadow-xs flex flex-col items-center text-center space-y-4">
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-medium text-emerald-800">
        <MapPin className="w-3.5 h-3.5" /> Camera scan with classroom geofence check
      </span>
      <h2 className="text-xl font-semibold text-slate-900 font-headline">Scan the classroom QR code</h2>
      <p className="text-sm text-slate-500 max-w-md">Point your camera at the rotating QR code your faculty is displaying. Allow location access so the geofence can be verified.</p>

      <div className="relative w-64 h-64 max-w-full aspect-square rounded-3xl bg-slate-900 flex items-center justify-center overflow-hidden">
        <video aria-label="Camera preview" ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${phase === "scanning" ? "opacity-100" : "opacity-0"}`} muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {phase !== "scanning" && (
          <div className="flex flex-col items-center gap-2 text-slate-400 z-10">
            {busy ? (
              <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
            ) : (
              <QrCode className="w-16 h-16 text-slate-600" />
            )}
            <span className="text-xs font-medium">
              {phase === "requesting-camera" ? "Requesting camera…" : scanQr.isPending ? "Verifying…" : "Ready to scan"}
            </span>
          </div>
        )}
      </div>

      <Button size="lg" icon={<QrCode className="w-4 h-4" />} disabled={busy} onClick={() => { scanQr.reset(); start(); }}>
        {phase === "scanning" ? "Looking for a QR code…" : "Start camera"}
      </Button>

      {scanQr.isSuccess && (
        <p role="status" className="p-4 bg-emerald-50 rounded-xl text-sm text-emerald-900 flex items-center gap-2 text-left">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          {scanQr.data.message} ({scanQr.data.subject})
        </p>
      )}
      {error && (
        <p role="alert" className="p-4 bg-red-50 rounded-xl text-sm text-red-900 flex items-center gap-2 text-left">
          <XCircle className="w-5 h-5 text-red-700 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function PetitionsTab() {
  const petitions = useMyPetitions();
  const subjects = useMySubjectAttendance();
  const createPetition = useCreatePetition();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<CreatePetitionInput>({ subjectCode: "", date: "", period: 1, reason: "" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    createPetition.mutate(form, {
      onSuccess: () => {
        toast.success("Petition submitted for review.");
        setIsOpen(false);
        setForm({ subjectCode: "", date: "", period: 1, reason: "" });
      },
    });
  };

  return (
    <SectionCard title="Correction petitions" action={<Button size="sm" onClick={() => setIsOpen(true)}>New petition</Button>}>
      <QueryState query={petitions} empty={{ title: "No petitions yet", description: "File one if a class you attended on duty or medical leave was marked absent." }}>
        {(list) => (
          <div className="space-y-3">
            {list.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-border-subtle space-y-1.5 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-sm text-slate-900">{p.subjectName ?? p.subjectCode}</h3>
                    <p className="text-slate-500">
                      {formatDate(p.date)} · Period {p.period}
                    </p>
                  </div>
                  <Badge variant={PETITION_VARIANT[p.status]}>{p.status}</Badge>
                </div>
                <p className="text-slate-600">{p.reason}</p>
                {p.remarks && <p className="text-xs text-slate-500">Reviewer: {p.remarks}</p>}
              </div>
            ))}
          </div>
        )}
      </QueryState>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="New correction petition" description="For classes you attended on duty or with a medical certificate but were marked absent.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Subject">
            <SelectInput required value={form.subjectCode} onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}>
              <option value="" disabled>
                Select a subject
              </option>
              {subjects.data?.map((s) => (
                <option key={s.subjectCode} value={s.subjectCode}>
                  {s.subjectCode} — {s.subjectName}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date of class">
              <TextInput type="date" required max={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Period">
              <TextInput type="number" required min={1} max={10} value={form.period} onChange={(e) => setForm({ ...form, period: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Reason" hint="e.g. Represented the college at an inter-university event (OD slip attached)">
            <TextArea required maxLength={1000} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
          <ModalActions>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createPetition.isPending}>
              Submit petition
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </SectionCard>
  );
}
