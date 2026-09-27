"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandSearch } from "../ui/command-search";
import { UserRole } from "@/types";
import { authService } from "@/services/auth.service";
import { ROLES_CONFIG } from "@/lib/roles";
import { clsx } from "clsx";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: UserRole;
}

export function DashboardLayout({ children, role = "ADMIN" }: DashboardLayoutProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandSearchOpen, setIsCommandSearchOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const user = authService.getCurrentUser();
      if (!user) return false;
      if (user.role !== "ADMIN" && role && user.role !== role) return false;
      return true;
    }
    return false;
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    // Role-based protection: non-admins cannot access other roles' areas
    if (user.role !== "ADMIN" && role && user.role !== role) {
      const authorizedPath = ROLES_CONFIG[user.role]?.defaultPath || "/login";
      router.replace(authorizedPath);
    }
  }, [role, router]);

  // Loading state prevents unauthorized flash
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3B60] text-white flex items-center justify-center font-bold text-lg animate-pulse">
            J
          </div>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
            Verifying Institutional Credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentRole={role}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-72 h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200"
          >
            <Sidebar
              currentRole={role}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Top Fixed Header */}
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenCommandSearch={() => setIsCommandSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main
        className={clsx(
          "flex-1 pt-16 transition-all duration-300 min-h-screen",
          isSidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <div className="p-6 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Global ⌘K Command Search Modal */}
      <CommandSearch
        isOpen={isCommandSearchOpen}
        onClose={() => setIsCommandSearchOpen(false)}
      />
    </div>
  );
}
