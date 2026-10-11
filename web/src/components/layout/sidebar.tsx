"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { clsx } from "clsx";
import type { UserRole } from "@/types";
import { navigationFor, type NavItem } from "@/config/navigation";
import { ROLES_CONFIG } from "@/lib/auth/roles";
import { BrandMark } from "./brand-mark";

interface SidebarProps {
  role: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  /** Rendered inside the mobile drawer: shows a close button instead of collapse. */
  variant?: "desktop" | "drawer";
}

function isActive(item: NavItem, pathname: string) {
  return pathname === item.href || (!item.href.endsWith("/dashboard") && pathname.startsWith(`${item.href}/`));
}

export function Sidebar({ role, isCollapsed, onToggleCollapse, variant = "desktop" }: SidebarProps) {
  const pathname = usePathname();
  const sections = navigationFor(role);
  const collapsed = variant === "desktop" && isCollapsed;

  return (
    <aside
      aria-label="Main navigation"
      className={clsx(
        "h-full bg-white flex flex-col border-r border-border-subtle select-none",
        variant === "desktop" && "fixed left-0 top-0 z-40 transition-[width] duration-200",
        variant === "desktop" && (collapsed ? "w-[72px]" : "w-64"),
        variant === "drawer" && "w-full",
      )}
    >
      <div className={clsx("h-16 px-4 flex items-center border-b border-border-subtle shrink-0", collapsed ? "justify-center" : "justify-between gap-2")}>
        {!collapsed && (
          <Link href={ROLES_CONFIG[role].defaultPath} className="flex items-center gap-2.5 min-w-0 rounded-lg">
            <BrandMark size={34} />
            <span className="flex flex-col min-w-0">
              <span className="font-semibold text-[15px] text-slate-900 tracking-tight truncate leading-tight font-headline">JBIT Campus ERP</span>
              <span className="text-xs text-slate-500 truncate leading-tight">{ROLES_CONFIG[role].label}</span>
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={variant === "drawer" ? "Close navigation menu" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={variant === "desktop" ? !collapsed : undefined}
          className="w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        >
          {variant === "drawer" ? <X className="w-5 h-5" /> : collapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
        </button>
      </div>

      <nav className="overflow-y-auto flex-1 px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            {collapsed ? (
              <div className="mx-3 mb-2 h-px bg-border-subtle first:hidden" aria-hidden />
            ) : (
              <h2 className="px-3 pb-1.5 text-xs font-medium text-slate-500">{section.title}</h2>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={clsx(
                        "flex items-center gap-3 h-10 px-3 rounded-xl text-sm transition-colors",
                        active ? "bg-surface-container-low text-primary-container font-semibold" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <span aria-hidden className={clsx("shrink-0", active ? "text-primary-container" : "text-slate-500")}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md leading-none bg-primary-container text-white">{item.badge}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
