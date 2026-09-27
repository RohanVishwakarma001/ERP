"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users2,
  CalendarDays,
  Grid3X3,
  CalendarCheck2,
  ShieldCheck,
  Ban,
  Lock,
  Briefcase,
  Award,
  Wallet,
  BookOpen,
  Bed,
  Bus,
  BellRing,
  HelpCircle,
  Bot,
  KeyRound,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { UserRole } from "@/types";

interface SidebarProps {
  currentRole?: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ currentRole = "ADMIN", isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      title: "Main",
      items: [
        {
          label: "Overview / Dashboard",
          href: currentRole === "ADMIN" ? "/admin/dashboard" : `/${currentRole.toLowerCase()}/dashboard`,
          icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
        },
      ],
    },
    {
      title: "Academic Affairs",
      items: [
        {
          label: "Departments",
          href: "/admin/departments",
          icon: <Building2 className="w-[18px] h-[18px]" />,
        },
        {
          label: "Programs & Courses",
          href: "/admin/courses",
          icon: <GraduationCap className="w-[18px] h-[18px]" />,
        },
        {
          label: "Faculty Workload",
          href: "/admin/faculty",
          icon: <Users2 className="w-[18px] h-[18px]" />,
        },
        {
          label: "Student Roster",
          href: "/admin/students",
          icon: <Users2 className="w-[18px] h-[18px]" />,
          badge: "2,840",
        },
        {
          label: "TPC Placement Drive",
          href: "/admin/placement",
          icon: <Briefcase className="w-[18px] h-[18px]" />,
          badge: "Live 2",
          badgeColor: "bg-emerald-500 text-white",
        },
        {
          label: "Recruiter Scoring & LOI",
          href: "/admin/recruiter",
          icon: <Award className="w-[18px] h-[18px]" />,
        },
      ],
    },
    {
      title: "Scheduling & Operations",
      items: [
        {
          label: "Timetable Engine",
          href: "/admin/timetable",
          icon: <CalendarDays className="w-[18px] h-[18px]" />,
        },
        {
          label: "Classroom & Lab Matrix",
          href: "/admin/classrooms",
          icon: <Grid3X3 className="w-[18px] h-[18px]" />,
        },
        {
          label: "Exam Seating & COE",
          href: "/admin/exams",
          icon: <CalendarCheck2 className="w-[18px] h-[18px]" />,
        },
      ],
    },
    {
      title: "Governance & Compliance",
      items: [
        {
          label: "UTU Affiliation",
          href: "/admin/utu-affiliation",
          icon: <ShieldCheck className="w-[18px] h-[18px]" />,
        },
        {
          label: "Attendance Debarment",
          href: "/admin/debarment",
          icon: <Ban className="w-[18px] h-[18px]" />,
          badge: "Ord 14B",
          badgeColor: "bg-red-500 text-white",
        },
        {
          label: "Grade Locking",
          href: "/admin/grade-locking",
          icon: <Lock className="w-[18px] h-[18px]" />,
        },
      ],
    },
    {
      title: "Campus Infrastructure",
      items: [
        {
          label: "Fee Ledger & Accounts",
          href: "/admin/fees",
          icon: <Wallet className="w-[18px] h-[18px]" />,
        },
        {
          label: "Central Library",
          href: "/admin/library",
          icon: <BookOpen className="w-[18px] h-[18px]" />,
        },
        {
          label: "Hostels & Outpass",
          href: "/admin/hostel",
          icon: <Bed className="w-[18px] h-[18px]" />,
        },
        {
          label: "Fleet & Transport",
          href: "/admin/transport",
          icon: <Bus className="w-[18px] h-[18px]" />,
        },
        {
          label: "Campus Notices",
          href: "/admin/notices",
          icon: <BellRing className="w-[18px] h-[18px]" />,
        },
        {
          label: "Grievances & Tickets",
          href: "/admin/complaints",
          icon: <HelpCircle className="w-[18px] h-[18px]" />,
        },
      ],
    },
    {
      title: "System & AI",
      items: [
        {
          label: "AI Campus Copilot",
          href: "/admin/ai-copilot",
          icon: <Bot className="w-[18px] h-[18px] text-cyan-600" />,
          badge: "Smart",
          badgeColor: "bg-cyan-600 text-white",
        },
        {
          label: "Role Permissions",
          href: "/admin/permissions",
          icon: <KeyRound className="w-[18px] h-[18px]" />,
        },
        {
          label: "Audit Logs",
          href: "/admin/audit-logs",
          icon: <FileSpreadsheet className="w-[18px] h-[18px]" />,
        },
        {
          label: "System Settings",
          href: "/admin/settings",
          icon: <Settings className="w-[18px] h-[18px]" />,
        },
      ],
    },
  ];

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-full bg-white z-50 flex flex-col border-r border-[#E2E8F0] shadow-sm select-none transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#F1F5F9]">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0B3B60] flex items-center justify-center text-white shrink-0 font-bold text-base shadow-xs">
              J
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-900 tracking-tight truncate leading-tight font-headline">
                JBIT ERP
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#0B3B60] font-bold leading-none mt-0.5">
                Admin Console
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#0B3B60] flex items-center justify-center text-white font-bold text-base shadow-xs">
              J
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors flex items-center justify-center"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="overflow-y-auto flex-1 px-2.5 py-3 space-y-4 no-scrollbar">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 pb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {section.title}
                </span>
              </div>
            )}
            {section.items.map((item, iIdx) => {
              const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={iIdx}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={clsx(
                    "flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                    isActive
                      ? "bg-[#0B3B60] text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-[#F1F5F9] hover:text-slate-900",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <span className={clsx("shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800")}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span
                      className={clsx(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none",
                        item.badgeColor || (isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Node Pill */}
      {!isCollapsed && (
        <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] m-2 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-slate-800 leading-none">UTU Cloud Node</span>
              <span className="text-[9px] text-slate-400 leading-tight mt-0.5">Node 04 • v2.6.4</span>
            </div>
          </div>
          <span className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] text-slate-500 font-mono font-bold">
            STABLE
          </span>
        </div>
      )}
    </aside>
  );
}
