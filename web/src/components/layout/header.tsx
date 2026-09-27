"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react";
import { authService } from "@/services/auth.service";
import { User } from "@/types";
import { ROLES_CONFIG } from "@/lib/roles";

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onOpenMobileMenu?: () => void;
  onOpenCommandSearch?: () => void;
}

export function Header({
  isSidebarCollapsed,
  onOpenMobileMenu,
  onOpenCommandSearch,
}: HeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      return authService.getCurrentUser();
    }
    return null;
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);

  useEffect(() => {
    if (!currentUser && typeof window !== "undefined") {
      const user = authService.getCurrentUser();
      if (!user) {
        router.push("/login");
      }
    }
  }, [currentUser, router]);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs z-40 flex items-center justify-between px-6 transition-all duration-300"
      style={{
        left: typeof window !== "undefined" && window.innerWidth >= 1024 ? (isSidebarCollapsed ? "4rem" : "16rem") : "0",
      }}
    >
      {/* Left Search and Mobile Menu Button */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          type="button"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenCommandSearch}
          type="button"
          className="w-full h-9 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-3 pr-2 flex items-center justify-between text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="truncate">Search students, faculty, rooms, courses (e.g. CS-602, Bhatt)...</span>
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 shadow-2xs">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Strip */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Academic Session Pill */}
        <div className="hidden xl:flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-full text-xs">
          <Calendar className="w-3.5 h-3.5 text-[#0B3B60]" />
          <span className="font-semibold text-slate-800">AY 2024-25</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">Even Semester</span>
        </div>

        {/* Live Synced Indicator */}
        <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Synced</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center"
            type="button"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
          </button>

          {isNotifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9] font-semibold text-slate-800">
                <span>Recent Notifications</span>
                <span className="text-[10px] text-[#0B3B60] hover:underline cursor-pointer">Mark all read</span>
              </div>
              <div className="py-2 space-y-2">
                <div className="p-2 rounded-lg bg-[#EFF4FF] border border-[#DCE9FF]">
                  <p className="font-semibold text-slate-900">Mid-Term Exams start May 12, 2025</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Cryptographic hall tickets available for download.</p>
                </div>
                <div className="p-2 rounded-lg bg-[#F8FAFC]">
                  <p className="font-semibold text-slate-800">Microsoft Campus Drive Shortlist Released</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">22 CSE students invited to Bar Raiser round.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card & Role Switcher */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
            type="button"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0B3B60] text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-200 shrink-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser?.name?.charAt(0) || "U"
              )}
            </div>

            <div className="hidden lg:flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {currentUser?.name || "Dr. Rajesh Bhatt"}
              </span>
              <span className="text-[10px] text-slate-500 truncate leading-tight">
                {currentUser?.role ? ROLES_CONFIG[currentUser.role]?.label : "Admin"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="pb-2.5 mb-2 border-b border-[#F1F5F9]">
                <p className="font-bold text-sm text-slate-900">{currentUser?.name}</p>
                <p className="text-xs text-slate-500">{currentUser?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#0B3B60]/10 text-[#0B3B60]">
                  Role: {currentUser?.role}
                </span>
              </div>

              <div className="pt-2 mt-1 border-t border-[#F1F5F9]">
                <button
                  onClick={handleLogout}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
