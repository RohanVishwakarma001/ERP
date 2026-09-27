"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/auth.service";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit verification code sent to your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.resetPassword(identifier.trim(), otp, newPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(res.message || "Unable to reset password.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0B3B60] text-white mx-auto flex items-center justify-center font-bold text-xl shadow-md mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline">
          Set a New Password
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Enter the 6-digit code emailed to your registered address, and choose a new password.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 rounded-2xl border border-[#E2E8F0] shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm text-slate-700">Password reset successfully. Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional ID / Email / Roll Number
                </label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  minLength={3}
                  type="text"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Verification Code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 tracking-[0.3em] font-bold text-center focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  type="password"
                  autoComplete="new-password"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  type="password"
                  autoComplete="new-password"
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <a href="/login" className="text-xs text-[#0B3B60] font-semibold hover:underline">
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
