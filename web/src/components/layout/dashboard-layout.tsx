"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/features/auth";
import { getDefaultDashboardPath, isPathAllowedForRole } from "@/lib/auth/route-guards";
import { CommandSearch } from "../ui/command-search";
import { FullScreenLoader } from "./full-screen-loader";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

const COLLAPSE_KEY = "jbit.sidebarCollapsed";

/**
 * Authenticated page shell (sidebar + header). The real access gate is the
 * server-side proxy; this client check only covers a session that changed while
 * the tab was open.
 */
export function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  // The drawer counts as open only on the path it was opened from, so navigating closes it.
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const isMobileMenuOpen = mobileMenuPath === pathname;
  const [isCommandSearchOpen, setIsCommandSearchOpen] = useState(false);

  const isAllowed = user ? isPathAllowedForRole(user.role, pathname) : false;

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authenticated" && user && !isAllowed) router.replace(getDefaultDashboardPath(user.role));
  }, [status, user, isAllowed, pathname, router]);

  // Drawer: Escape closes it and the page behind doesn't scroll.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileMenuPath(null);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [isMobileMenuOpen]);

  const toggleCollapsed = () =>
    setIsSidebarCollapsed((v) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
      } catch {
        /* storage unavailable: preference just isn't remembered */
      }
      return !v;
    });

  if (status !== "authenticated" || !user || !isAllowed) {
    return <FullScreenLoader label="Verifying your session…" />;
  }

  return (
    <div className="min-h-dvh bg-surface-canvas text-slate-800">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-white focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <div className="hidden lg:block">
        <Sidebar role={user.role} isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleCollapsed} />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div aria-hidden onClick={() => setMobileMenuPath(null)} className="absolute inset-0 bg-black/40 animate-in fade-in" />
          <div className="relative w-[min(18rem,85vw)] h-full bg-white shadow-xl animate-in slide-in-from-left">
            <Sidebar role={user.role} isCollapsed={false} onToggleCollapse={() => setMobileMenuPath(null)} variant="drawer" />
          </div>
        </div>
      )}

      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        onOpenMobileMenu={() => setMobileMenuPath(pathname)}
        onOpenCommandSearch={() => setIsCommandSearchOpen(true)}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className={clsx("pt-16 min-h-dvh outline-none transition-[padding] duration-200", isSidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64")}
      >
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1440px] mx-auto w-full">{children}</div>
      </main>

      <CommandSearch isOpen={isCommandSearchOpen} onOpenChange={setIsCommandSearchOpen} />
    </div>
  );
}
