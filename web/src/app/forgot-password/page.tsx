"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authService.forgotPassword(identifier.trim());
      setMessage(res.message);
      setSubmitted(true);
    } catch {
      setError("Unable to process this request right now. Please try again shortly.");
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
          Reset Institutional Password
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered email, roll number, or employee ID. If an account exists, we&apos;ll email a
          verification code to reset your password.
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

          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-700">{message}</p>
              <button
                type="button"
                onClick={() => router.push(`/reset-password?identifier=${encodeURIComponent(identifier.trim())}`)}
                className="w-full h-11 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                I have a code — Reset Password
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional ID / Email / Roll Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    minLength={3}
                    type="text"
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Verification Code"}
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
