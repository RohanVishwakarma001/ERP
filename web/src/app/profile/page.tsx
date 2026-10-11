"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Briefcase, Bus, GraduationCap, Home, KeyRound, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard, CardLink } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/list";
import { Field, TextInput } from "@/components/ui/form-field";
import { QueryState } from "@/components/ui/query-state";
import { useAuth } from "@/features/auth";
import { useChangeOwnPassword, useProfile, type Profile } from "@/features/profile";
import { ROLES_CONFIG } from "@/lib/auth/roles";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { STRONG_PASSWORD, STRONG_PASSWORD_HINT } from "@/lib/password";
import { toast } from "@/lib/toast-store";

/** Label / value rows; empty values show a dash rather than disappearing. */
function Details({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-slate-500">{label}</dt>
          <dd className="text-sm text-slate-900 mt-0.5 break-words">{value === null || value === undefined || value === "" ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StudentSections({ s }: { s: NonNullable<Profile["student"]> }) {
  return (
    <>
      <SectionCard title="Academic details" icon={<GraduationCap className="w-5 h-5" />}>
        <Details
          rows={[
            ["Roll number", <span key="r" className="font-mono">{s.rollNumber}</span>],
            ["Enrollment number", <span key="e" className="font-mono">{s.enrollmentNumber}</span>],
            ["Program", `${s.program.name} (${s.program.code})`],
            ["Department", `${s.department.name} (${s.department.code})`],
            ["Semester", `${s.semester} of ${s.totalSemesters}`],
            ["Section", s.section],
            ["Admission year", s.admissionYear],
            ["CGPA", s.cgpa ? s.cgpa.toFixed(2) : null],
            [
              "Attendance",
              <span key="a" className="inline-flex items-center gap-2">
                {formatPercent(s.overallAttendance)}
                {s.isDebarred && <Badge variant="error">Below 75% · debarred</Badge>}
              </span>,
            ],
            ["KYC", s.kycVerified ? <Badge key="k" variant="success">Verified</Badge> : <Badge key="k" variant="warning">Pending</Badge>],
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Fees"
        icon={<Wallet className="w-5 h-5" />}
        action={<CardLink href="/student/fees">Fees &amp; payments</CardLink>}
      >
        <Details
          rows={[
            [
              "Outstanding",
              s.fees.pendingDues ? (
                <span key="p" className="inline-flex items-center gap-2 font-semibold">
                  {formatCurrency(s.fees.pendingDues)}
                  {s.fees.overdue && <Badge variant="error">Overdue</Badge>}
                </span>
              ) : (
                <Badge key="p" variant="success">No dues</Badge>
              ),
            ],
          ]}
        />
      </SectionCard>

      <SectionCard title="Guardian" icon={<UserRound className="w-5 h-5" />}>
        <Details rows={[["Name", s.guardianName], ["Phone", s.guardianPhone]]} />
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Hostel" icon={<Home className="w-5 h-5" />}>
          {s.hostel ? (
            <Details rows={[["Building", s.hostel.building], ["Room / bed", `${s.hostel.room} / ${s.hostel.bed}`]]} />
          ) : (
            <p className="text-sm text-slate-500">No hostel allocation.</p>
          )}
        </SectionCard>
        <SectionCard title="Transport" icon={<Bus className="w-5 h-5" />}>
          {s.transport ? (
            <Details
              rows={[
                ["Route", s.transport.route],
                ["Bus", s.transport.bus],
                ["Pickup stop", s.transport.pickupStop],
                ["Pass", `${s.transport.passNumber}${s.transport.validUntil ? ` · valid till ${formatDate(s.transport.validUntil)}` : ""}`],
              ]}
            />
          ) : (
            <p className="text-sm text-slate-500">No bus pass.</p>
          )}
        </SectionCard>
      </div>
    </>
  );
}

function FacultySection({ f }: { f: NonNullable<Profile["faculty"]> }) {
  return (
    <SectionCard title="Employment details" icon={<Briefcase className="w-5 h-5" />}>
      <Details
        rows={[
          ["Employee code", <span key="c" className="font-mono">{f.employeeCode}</span>],
          ["Department", `${f.department.name} (${f.department.code})`],
          ["Designation", f.designation],
          ["Qualification", f.qualification],
          ["Specialization", f.specialization],
          ["Teaching norm", `${f.weeklyHoursNorm} h per week`],
        ]}
      />
      <div className="mt-5">
        <h3 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
          <BookOpen aria-hidden className="w-4 h-4" /> Courses assigned
        </h3>
        {f.subjects.length ? (
          <ul className="flex flex-wrap gap-2">
            {f.subjects.map((s) => (
              <li key={s.code} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                <span className="font-mono font-semibold">{s.code}</span> {s.name} · Sem {s.semester}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No courses assigned yet.</p>
        )}
      </div>
    </SectionCard>
  );
}

function ChangePasswordCard({ managedByEnv }: { managedByEnv: boolean }) {
  const router = useRouter();
  const { logout } = useAuth();
  const change = useChangeOwnPassword();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState<string>();

  if (managedByEnv) {
    return (
      <SectionCard title="Password" icon={<KeyRound className="w-5 h-5" />}>
        <p className="text-sm text-slate-600">This administrator account’s email and password are set in the server’s .env file.</p>
      </SectionCard>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!STRONG_PASSWORD.test(form.newPassword)) return setError(STRONG_PASSWORD_HINT);
    if (form.newPassword !== form.confirm) return setError("The new passwords don’t match.");
    setError(undefined);
    change.mutate(
      { oldPassword: form.oldPassword, newPassword: form.newPassword },
      {
        onSuccess: async () => {
          toast.success("Password changed. Please sign in with your new password.");
          await logout();
          router.replace("/login");
        },
      },
    );
  };

  return (
    <SectionCard title="Change password" subtitle="You’ll be signed out everywhere and asked to sign in again." icon={<KeyRound className="w-5 h-5" />}>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        <Field label="Current password">
          <TextInput required type="password" autoComplete="current-password" value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} />
        </Field>
        <Field label="New password" error={error}>
          <TextInput required type="password" autoComplete="new-password" maxLength={72} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </Field>
        <Field label="Confirm new password">
          <TextInput required type="password" autoComplete="new-password" maxLength={72} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </Field>
        <div className="sm:col-span-3 flex justify-end">
          <Button type="submit" loading={change.isPending}>
            Change password
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

export default function ProfilePage() {
  const profile = useProfile();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <PageHeader title="My profile" description="Everything the institute holds about your account." />
        <QueryState query={profile} isEmpty={() => false}>
          {(p) => (
            <>
              <section className="p-6 rounded-3xl bg-white border border-border-subtle shadow-xs flex flex-col sm:flex-row sm:items-center gap-5">
                <Avatar name={p.account.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-slate-900 font-headline">{p.account.name}</h2>
                  <p className="text-sm text-slate-600 break-all">{p.account.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="primary">{ROLES_CONFIG[p.account.role]?.label ?? p.account.role}</Badge>
                    <Badge variant={p.account.status === "ACTIVE" ? "success" : "warning"}>{p.account.status === "ACTIVE" ? "Active" : p.account.status}</Badge>
                  </div>
                </div>
              </section>

              <SectionCard title="Account" icon={<ShieldCheck className="w-5 h-5" />}>
                <Details
                  rows={[
                    ["Email (sign-in)", p.account.email],
                    ["Phone", p.account.phone],
                    ["Member since", p.account.memberSince ? formatDate(p.account.memberSince) : null],
                    ...(p.staff ? ([["Designation", p.staff.designation], ["Employee ID", p.staff.employeeId]] as [string, ReactNode][]) : []),
                  ]}
                />
                <p className="text-xs text-slate-500 mt-4">To correct any of these details, contact the administration office.</p>
              </SectionCard>

              {p.student && <StudentSections s={p.student} />}
              {p.faculty && <FacultySection f={p.faculty} />}
              <ChangePasswordCard managedByEnv={p.account.managedByEnv} />
            </>
          )}
        </QueryState>
      </div>
    </DashboardLayout>
  );
}
