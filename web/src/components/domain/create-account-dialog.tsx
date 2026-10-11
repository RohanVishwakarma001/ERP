"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field, SelectInput, TextInput } from "@/components/ui/form-field";
import { useDepartments, usePrograms, useSections } from "@/features/departments";
import { useCreateAccount, type CreateAccountInput } from "@/features/users";
import { ROLES_CONFIG } from "@/lib/auth/roles";
import { toast } from "@/lib/toast-store";
import type { UserRole } from "@/types";

const TEACHING: UserRole[] = ["FACULTY", "HOD"];
const STAFF: UserRole[] = ["ACCOUNTANT", "EXAM_OFFICER", "LIBRARIAN", "PLACEMENT_OFFICER", "HOSTEL_WARDEN", "TRANSPORT_MANAGER"];

/** Mirrors the backend rule (common/validators/password.ts). */
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
const CODE_PATTERN = "[A-Za-z0-9][A-Za-z0-9/_\\-]{1,29}";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  password: "",
  programId: "",
  sectionId: "",
  rollNumber: "",
  enrollmentNumber: "",
  semester: "1",
  admissionYear: String(new Date().getFullYear()),
  guardianName: "",
  guardianPhone: "",
  departmentId: "",
  employeeCode: "",
  qualification: "",
  specialization: "",
  designation: "",
  employeeId: "",
};

/** A random password that satisfies the strength rule, from the browser's CSPRNG. */
function generatePassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*?"];
  const all = sets.join("");
  const random = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = [...sets.map((s) => s[random(s.length)]), ...Array.from({ length: 10 }, () => all[random(all.length)])];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

interface CreateAccountDialogProps {
  open: boolean;
  onClose: () => void;
  /** Only the super admin may create administrator accounts. */
  allowAdmin: boolean;
}

export function CreateAccountDialog({ open, onClose, allowAdmin }: CreateAccountDialogProps) {
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [form, setForm] = useState(EMPTY);
  const [passwordError, setPasswordError] = useState<string>();
  const create = useCreateAccount();

  const isStudent = role === "STUDENT";
  const isTeaching = TEACHING.includes(role);
  const isStaff = role === "ADMIN" || STAFF.includes(role);

  const programs = usePrograms({ enabled: open && isStudent });
  const sections = useSections({ enabled: open && isStudent });
  const departments = useDepartments();

  const roleOptions = (allowAdmin ? (["ADMIN"] as UserRole[]) : []).concat(["STUDENT", ...TEACHING, ...STAFF]);
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const selectedProgram = programs.data?.find((p) => p.id === form.programId);

  const close = () => {
    setForm(EMPTY);
    setPasswordError(undefined);
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!STRONG_PASSWORD.test(form.password)) {
      setPasswordError("Use 8–72 characters with upper- and lower-case letters, a number and a symbol.");
      return;
    }
    setPasswordError(undefined);

    const input: CreateAccountInput = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      role,
      password: form.password,
      ...(isStudent && {
        programId: form.programId,
        sectionId: form.sectionId || undefined,
        rollNumber: form.rollNumber,
        enrollmentNumber: form.enrollmentNumber,
        semester: Number(form.semester),
        admissionYear: Number(form.admissionYear),
        guardianName: form.guardianName || undefined,
        guardianPhone: form.guardianPhone || undefined,
      }),
      ...(isTeaching && {
        departmentId: form.departmentId,
        employeeCode: form.employeeCode,
        qualification: form.qualification,
        specialization: form.specialization || undefined,
        designation: form.designation,
      }),
      ...(isStaff && { employeeId: form.employeeId, designation: form.designation }),
    };

    create.mutate(input, {
      onSuccess: (account) => {
        toast.success(`Account created for ${account.name}. Share the password with them privately.`);
        close();
      },
    });
  };

  const noPrograms = isStudent && programs.isSuccess && programs.data.length === 0;
  const noDepartments = isTeaching && departments.isSuccess && departments.data.length === 0;

  return (
    <Modal open={open} onClose={close} title="Create account" description="The person signs in with this email and password." size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Role">
          <SelectInput value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLES_CONFIG[r].label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <TextInput required maxLength={120} autoComplete="off" value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Email" hint="Used to sign in and to reset the password">
            <TextInput required type="email" maxLength={254} autoComplete="off" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" optional>
            <TextInput type="tel" maxLength={20} autoComplete="off" value={form.phone} onChange={set("phone")} />
          </Field>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <Field label="Initial password" error={passwordError} hint="Share it privately; they can change it with “Forgot password”.">
                <TextInput
                  required
                  type="text"
                  autoComplete="new-password"
                  spellCheck={false}
                  maxLength={72}
                  className="font-mono"
                  value={form.password}
                  onChange={set("password")}
                />
              </Field>
            </div>
            <Button
              variant="secondary"
              className="mt-7"
              icon={<Dices className="w-4 h-4" />}
              onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
            >
              Generate
            </Button>
          </div>
        </div>

        {isStudent && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900 mb-3">Student details</legend>
            {noPrograms && (
              <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
                Add a program first under{" "}
                <Link href="/admin/courses" className="font-semibold underline">
                  Programs &amp; Courses
                </Link>
                .
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Program">
                <SelectInput required value={form.programId} onChange={set("programId")} disabled={!programs.data?.length}>
                  <option value="">{programs.isPending ? "Loading…" : "Choose a program"}</option>
                  {programs.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.departmentCode})
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Section" optional>
                <SelectInput value={form.sectionId} onChange={set("sectionId")}>
                  <option value="">No section yet</option>
                  {sections.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · Sem {s.semester} · {s.academicYear}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Roll number" hint="Can also be used to sign in">
                <TextInput required pattern={CODE_PATTERN} maxLength={30} value={form.rollNumber} onChange={set("rollNumber")} />
              </Field>
              <Field label="Enrollment number">
                <TextInput required pattern={CODE_PATTERN} maxLength={30} value={form.enrollmentNumber} onChange={set("enrollmentNumber")} />
              </Field>
              <Field label="Current semester">
                <TextInput
                  required
                  type="number"
                  min={1}
                  max={selectedProgram?.totalSemesters ?? 12}
                  value={form.semester}
                  onChange={set("semester")}
                />
              </Field>
              <Field label="Admission year">
                <TextInput required type="number" min={1990} max={2100} value={form.admissionYear} onChange={set("admissionYear")} />
              </Field>
              <Field label="Guardian name" optional>
                <TextInput maxLength={120} value={form.guardianName} onChange={set("guardianName")} />
              </Field>
              <Field label="Guardian phone" optional>
                <TextInput type="tel" maxLength={20} value={form.guardianPhone} onChange={set("guardianPhone")} />
              </Field>
            </div>
          </fieldset>
        )}

        {isTeaching && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900 mb-3">{role === "HOD" ? "Head of department details" : "Faculty details"}</legend>
            {noDepartments && (
              <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
                Add a department first under{" "}
                <Link href="/admin/departments" className="font-semibold underline">
                  Departments
                </Link>
                .
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Department">
                <SelectInput required value={form.departmentId} onChange={set("departmentId")} disabled={!departments.data?.length}>
                  <option value="">{departments.isPending ? "Loading…" : "Choose a department"}</option>
                  {departments.data?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Employee code" hint="Can also be used to sign in">
                <TextInput required pattern={CODE_PATTERN} maxLength={30} value={form.employeeCode} onChange={set("employeeCode")} />
              </Field>
              <Field label="Designation" hint={role === "HOD" ? "“& HOD” is added if it isn't mentioned" : undefined}>
                <TextInput required maxLength={120} placeholder="e.g. Assistant Professor" value={form.designation} onChange={set("designation")} />
              </Field>
              <Field label="Qualification">
                <TextInput required maxLength={160} placeholder="e.g. M.Tech, Ph.D." value={form.qualification} onChange={set("qualification")} />
              </Field>
              <Field label="Specialization" optional>
                <TextInput maxLength={160} value={form.specialization} onChange={set("specialization")} />
              </Field>
            </div>
          </fieldset>
        )}

        {isStaff && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900 mb-3">Staff details</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Employee ID">
                <TextInput required pattern={CODE_PATTERN} maxLength={30} value={form.employeeId} onChange={set("employeeId")} />
              </Field>
              <Field label="Designation">
                <TextInput required maxLength={120} value={form.designation} onChange={set("designation")} />
              </Field>
            </div>
          </fieldset>
        )}

        <ModalActions>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending} disabled={noPrograms || noDepartments}>
            Create account
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
