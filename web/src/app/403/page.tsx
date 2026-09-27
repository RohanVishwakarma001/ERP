"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { authService } from "@/services/auth.service";
import { ROLES_CONFIG } from "@/lib/roles";

export default function AccessDeniedPage() {
  const currentUser = authService.getCurrentUser();
  const defaultPath = currentUser ? ROLES_CONFIG[currentUser.role]?.defaultPath : "/login";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full mb-3">
        Error 403 • Unauthorized Access
      </span>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-headline mt-1">
        Access Denied
      </h1>

      <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
        Your current account role{" "}
        <strong className="text-slate-800 font-semibold">
          ({currentUser?.role || "GUEST"})
        </strong>{" "}
        does not have institutional permission to access this protected ERP console.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={defaultPath}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] text-sm font-semibold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Dashboard</span>
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-slate-700 hover:bg-[#F8FAFC] text-sm font-semibold shadow-xs transition-colors"
        >
          <LogIn className="w-4 h-4" />
          <span>Switch Account / Sign In</span>
        </Link>
      </div>

      <div className="mt-12 text-xs text-slate-400">
        UTU Governance &amp; Role-Based Access Control Active
      </div>
    </div>
  );
}
