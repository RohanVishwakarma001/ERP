"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { getDefaultDashboardPath } from "@/lib/auth/route-guards";
import { FullScreenLoader } from "@/components/layout/full-screen-loader";

/** Entry point: sends signed-in users to their dashboard and everyone else to /login. */
export default function RootPage() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "loading") return;
    router.replace(user ? getDefaultDashboardPath(user.role) : "/login");
  }, [status, user, router]);

  return <FullScreenLoader label="Opening your dashboard…" />;
}
