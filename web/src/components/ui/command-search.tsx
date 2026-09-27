"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  Users2,
  CalendarDays,
  CalendarCheck2,
  Briefcase,
  Wallet,
  BookOpen,
  Bot,
  X,
  ArrowRight,
} from "lucide-react";

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandSearch({ isOpen, onClose }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: "Department Operations & Workload", path: "/admin/departments", icon: <Building2 className="w-4 h-4 text-[#0B3B60]" /> },
    { title: "Student Roster & Debarment (Ordinance 14B)", path: "/admin/students", icon: <Users2 className="w-4 h-4 text-emerald-600" /> },
    { title: "Timetable Scheduling Engine (Zero Clashes)", path: "/admin/timetable", icon: <CalendarDays className="w-4 h-4 text-indigo-600" /> },
    { title: "COE Seating Matrix & Mark Locking", path: "/admin/exams", icon: <CalendarCheck2 className="w-4 h-4 text-amber-600" /> },
    { title: "TPC Campus Placement & Drives Hub", path: "/admin/placement", icon: <Briefcase className="w-4 h-4 text-cyan-600" /> },
    { title: "Student Career Profile & Digital Grade Card", path: "/student/dashboard", icon: <BookOpen className="w-4 h-4 text-blue-600" /> },
    { title: "JBIT AI Campus Copilot", path: "/admin/ai-copilot", icon: <Bot className="w-4 h-4 text-purple-600" /> },
  ];

  const filteredLinks = quickLinks.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3 border-b border-[#E2E8F0]">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a module, course, or command..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Result Items */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Navigation
          </div>
          {filteredLinks.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No matching commands or pages found for &quot;{query}&quot;
            </div>
          ) : (
            filteredLinks.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigateTo(item.path)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F1F5F9] text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-slate-800 text-sm group-hover:text-[#0B3B60]">
                    {item.title}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B60] transition-colors" />
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with arrows</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
