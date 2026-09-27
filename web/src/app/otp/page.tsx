"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { authService } from "@/services/auth.service";

export default function OtpVerificationPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }
    setIsVerifying(true);
    setError(null);

    const valid = await authService.verifyOtp(code);
    setIsVerifying(false);
    if (valid) {
      const user = authService.getCurrentUser();
      if (user?.role === "ADMIN") router.push("/admin/dashboard");
      else if (user?.role === "STUDENT") router.push("/student/dashboard");
      else router.push("/admin/dashboard");
    } else {
      setError("Invalid OTP code. Please enter 123456 for testing.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0B3B60] text-white mx-auto flex items-center justify-center font-bold text-xl shadow-md mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline">
          Two-Factor Verification
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Enter the 6-digit authentication token sent to your registered institutional device. (Test OTP: <strong>123456</strong>)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 rounded-2xl border border-[#E2E8F0] shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  className="w-11 h-12 text-center text-lg font-bold border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/20"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full h-11 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? "Verifying..." : "Verify & Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setOtp(["1", "2", "3", "4", "5", "6"])}
              className="text-xs text-[#0B3B60] font-semibold hover:underline"
            >
              Auto-fill demo code (123456)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
