"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { authService } from "@/services/auth.service";
import { ROLES_CONFIG } from "@/lib/roles";

const loginSchema = z.object({
  identifier: z.string().min(3, "Please enter your registered email, Employee ID, or Roll Number"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await authService.login({
        identifier: data.identifier,
        password: data.password,
      });

      const next = searchParams.get("next");
      const targetPath = next || ROLES_CONFIG[res.user.role]?.defaultPath || "/login";
      router.push(targetPath);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Invalid credentials or server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background architectural glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#0B3B60]/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#BB0112]/5 blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0B3B60] text-white shadow-lg mb-4">
          <div className="w-10 h-10 rounded-xl bg-white text-[#0B3B60] flex items-center justify-center font-bold text-xl">
            J
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline">
          JBIT DEHRADUN • ERP
        </h1>
        <p className="mt-1 text-xs text-slate-500 uppercase tracking-widest font-semibold">
          Academic Enterprise Single Sign-On
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E2E8F0] shadow-xl">
          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional ID / Email / Roll Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  {...register("identifier")}
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. 2201040189 or your institutional email"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-xs text-red-600">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <a
                  href="/forgot-password"
                  className="text-xs text-[#0B3B60] font-semibold hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  {...register("password")}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded text-[#0B3B60] border-slate-300 focus:ring-0"
                />
                <span>Remember this workstation</span>
              </label>

              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                UTU 256-Bit SSL
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Veer Madho Singh Bhandari Uttarakhand Technical University (UTU) Affiliated
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
