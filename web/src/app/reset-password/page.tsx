"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "@/features/auth";
import { getErrorMessage } from "@/lib/api/api-error";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/form-field";
import { AuthShell, FormAlert, PasswordInput, PasswordRequirements, isStrongPassword } from "@/components/layout/auth-shell";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState(searchParams.get("identifier") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit verification code from your email.");
    if (!isStrongPassword(newPassword)) return setError("Your new password doesn't meet all the requirements below.");
    if (newPassword !== confirmPassword) return setError("The two passwords don't match.");

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(identifier.trim(), otp, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthShell title="Password updated">
        <div className="space-y-5 text-center">
          <div aria-hidden className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p role="status" className="text-sm text-slate-700">
            Your password has been reset and you&apos;ve been signed out of all devices. Sign in with your new password.
          </p>
          <Button size="lg" className="w-full" onClick={() => router.replace("/login")}>
            Go to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter the 6-digit code we emailed you, then set a new password."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-primary-container hover:underline underline-offset-4 rounded">
          <ArrowLeft aria-hidden className="w-4 h-4" /> Back to sign in
        </Link>
      }
    >
      {error && <FormAlert>{error}</FormAlert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email, employee ID or roll number">
          <TextInput
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            minLength={3}
            autoComplete="username"
            autoCapitalize="none"
            className="h-11"
          />
        </Field>

        <Field label="Verification code" hint="Didn't get it? Check spam, or request a new code.">
          <TextInput
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="h-11 tracking-[0.4em] font-semibold text-center font-tabular-nums"
          />
        </Field>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-800">
            New password
          </label>
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            maxLength={72}
            autoComplete="new-password"
            aria-describedby="password-rules"
          />
          <PasswordRequirements id="password-rules" value={newPassword} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-800">
            Confirm new password
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            maxLength={72}
            autoComplete="new-password"
            aria-invalid={mismatch || undefined}
            aria-describedby={mismatch ? "confirm-error" : undefined}
          />
          {mismatch && (
            <p id="confirm-error" className="text-xs text-red-700">
              Passwords don&apos;t match.
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {isSubmitting ? "Updating password…" : "Reset password"}
        </Button>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="font-medium text-primary-container hover:underline underline-offset-4 rounded">
            Request a new code
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
