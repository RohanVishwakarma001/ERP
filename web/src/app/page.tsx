"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { ROLES_CONFIG } from "@/lib/roles";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user && user.role) {
      const defaultPath = ROLES_CONFIG[user.role]?.defaultPath || "/login";
      router.replace(defaultPath);
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0B3B60] text-white flex items-center justify-center font-bold text-lg animate-pulse">
          J
        </div>
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
          Routing to JBIT Enterprise Console...
        </p>
      </div>
    </div>
  );
}
