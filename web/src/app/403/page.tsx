"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn, ShieldAlert } from "lucide-react";
import { useAuth } from "@/features/auth";
import { ROLES_CONFIG } from "@/lib/auth/roles";
import { getDefaultDashboardPath } from "@/lib/auth/route-guards";
import { buttonClasses } from "@/components/ui/button";
import { StatusPage } from "@/components/layout/status-page";

export default function AccessDeniedPage() {
  const { user } = useAuth();

  return (
    <StatusPage
      code="Error 403"
      icon={<ShieldAlert />}
      title="You don't have access to this page"
      actions={
        <>
          {user && (
            <Link href={getDefaultDashboardPath(user.role)} className={buttonClasses("primary")}>
              <LayoutDashboard aria-hidden className="w-4 h-4" /> Go to my dashboard
            </Link>
          )}
          <Link href="/login" className={buttonClasses(user ? "secondary" : "primary")}>
            <LogIn aria-hidden className="w-4 h-4" /> {user ? "Use another account" : "Sign in"}
          </Link>
        </>
      }
    >
      {user ? (
        <>
          Your role, <strong className="font-semibold text-slate-800">{ROLES_CONFIG[user.role].label}</strong>, isn&apos;t permitted to open it. If you
          think this is a mistake, contact the ERP administrator.
        </>
      ) : (
        "Sign in to continue."
      )}
    </StatusPage>
  );
}
