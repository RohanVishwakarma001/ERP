"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useMarkAllNotificationsRead, useNotificationFeed } from "@/features/notifications";
import { ROLES_CONFIG } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";
import { useDismiss } from "@/lib/use-dismiss";
import { Avatar } from "../ui/list";
import { EmptyState, LoadingState } from "../ui/query-state";

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onOpenMobileMenu: () => void;
  onOpenCommandSearch: () => void;
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close, triggerRef);

  const feed = useNotificationFeed();
  const markAllRead = useMarkAllNotificationsRead();
  const unread = feed.data?.unreadCount ?? 0;

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span aria-hidden className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold leading-4 text-center ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 sm:w-96 bg-white border border-border-subtle rounded-2xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-sm font-medium text-primary-container hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[min(24rem,70dvh)] overflow-y-auto p-2">
            {feed.isPending && <LoadingState label="Loading notifications…" rows={2} />}
            {feed.isError && <p className="p-3 text-sm text-slate-500">Couldn&apos;t load notifications.</p>}
            {feed.data?.items.length === 0 && <EmptyState compact icon={<Bell />} title="You're all caught up" />}
            <ul className="space-y-1">
              {feed.data?.items.map((n) => (
                <li key={n.id} className={clsx("p-3 rounded-xl", !n.isRead && "bg-surface-container-low")}>
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-container shrink-0" aria-label="Unread" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close, triggerRef);

  if (!user) return null;

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-2.5 h-10 pl-1 pr-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden lg:flex flex-col min-w-0 max-w-40">
          <span className="text-sm font-medium text-slate-900 truncate leading-tight">{user.name}</span>
          <span className="text-xs text-slate-500 truncate leading-tight">{ROLES_CONFIG[user.role].label}</span>
        </span>
        <ChevronDown aria-hidden className="w-4 h-4 text-slate-400 hidden lg:block" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-72 bg-white border border-border-subtle rounded-2xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
          <div className="p-4 border-b border-border-subtle flex items-center gap-3">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <p className="text-xs font-medium text-primary-container mt-0.5">{ROLES_CONFIG[user.role].label}</p>
            </div>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3 h-10 text-sm text-red-700 hover:bg-red-50 rounded-xl font-medium disabled:opacity-60"
            >
              <LogOut aria-hidden className="w-4 h-4" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header({ isSidebarCollapsed, onOpenMobileMenu, onOpenCommandSearch }: HeaderProps) {
  return (
    <header
      className={clsx(
        "fixed top-0 right-0 left-0 h-16 bg-white/85 backdrop-blur-xl border-b border-border-subtle z-40 flex items-center justify-between gap-3 px-3 sm:px-6 transition-[left] duration-200",
        isSidebarCollapsed ? "lg:left-[72px]" : "lg:left-64",
      )}
    >
      <div className="flex items-center gap-2 flex-1 max-w-xl min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onOpenCommandSearch}
          aria-label="Search pages (Ctrl+K)"
          className="w-full h-10 bg-slate-100 hover:bg-slate-200/70 rounded-xl pl-3 pr-2 flex items-center justify-between text-sm text-slate-500 transition-colors min-w-0"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Search aria-hidden className="w-4 h-4 shrink-0" />
            <span className="truncate">Search pages…</span>
          </span>
          <kbd className="hidden sm:inline-block bg-white border border-border-subtle px-1.5 py-0.5 rounded-md text-xs font-sans text-slate-500">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <NotificationsMenu />
        <div className="w-px h-6 bg-border-subtle mx-1 hidden sm:block" aria-hidden />
        <ProfileMenu />
      </div>
    </header>
  );
}
