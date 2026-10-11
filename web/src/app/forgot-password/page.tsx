"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";
import { authApi } from "@/features/auth";
import { getErrorMessage } from "@/lib/api/api-error";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/form-field";
import { AuthShell, FormAlert } from "@/components/layout/auth-shell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authApi.forgotPassword(identifier.trim());
      setMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={message ? "Check your email" : "Reset your password"}
      subtitle={message ? undefined : "Enter your registered email, roll number or employee ID. We'll email a 6-digit code to the address on file."}
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-primary-container hover:underline underline-offset-4 rounded">
          <ArrowLeft aria-hidden className="w-4 h-4" /> Back to sign in
        </Link>
      }
    >
      {error && <FormAlert>{error}</FormAlert>}

      {message ? (
        <div className="space-y-5 text-center">
          <div aria-hidden className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <MailCheck className="w-6 h-6" />
          </div>
          <p role="status" className="text-sm text-slate-700 leading-relaxed">
            {message}
          </p>
          <Button size="lg" className="w-full" onClick={() => router.push(`/reset-password?identifier=${encodeURIComponent(identifier.trim())}`)}>
            Enter verification code
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Email, employee ID or roll number">
            <TextInput
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              minLength={3}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className="h-11"
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            {isSubmitting ? "Sending code…" : "Send verification code"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
