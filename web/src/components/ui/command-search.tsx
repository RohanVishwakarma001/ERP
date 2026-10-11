"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { CornerDownLeft, Search } from "lucide-react";
import { useAuth } from "@/features/auth";
import { navigationFor } from "@/config/navigation";

interface CommandSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Ctrl/⌘+K page switcher, listing exactly the pages in the caller's navigation. */
export function CommandSearch({ isOpen, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setActive(0);
        onOpenChange(!isOpen);
      } else if (e.key === "Escape" && isOpen) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onOpenChange]);

  const items = useMemo(() => (user ? navigationFor(user.role).flatMap((s) => s.items) : []), [user]);
  const matches = items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1));

  if (!isOpen) return null;

  const go = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div aria-hidden onClick={() => onOpenChange(false)} className="absolute inset-0 bg-black/40 animate-in fade-in" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border-subtle">
          <Search aria-hidden className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={matches[activeIndex] ? `cmd-${activeIndex}` : undefined}
            aria-label="Search pages"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, matches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && matches[activeIndex]) {
                e.preventDefault();
                go(matches[activeIndex].href);
              }
            }}
            placeholder="Jump to a page…"
            className="flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <kbd className="text-xs text-slate-500 border border-border-subtle rounded-md px-1.5 py-0.5">Esc</kbd>
        </div>

        <ul id="command-results" role="listbox" aria-label="Pages" className="max-h-80 overflow-y-auto p-2">
          {matches.length === 0 ? (
            <li className="p-8 text-center text-sm text-slate-500">No pages match &ldquo;{query}&rdquo;.</li>
          ) : (
            matches.map((item, i) => (
              <li
                key={item.href}
                id={`cmd-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => go(item.href)}
                onMouseMove={() => setActive(i)}
                className={clsx(
                  "flex items-center justify-between gap-3 px-3 h-12 rounded-xl cursor-pointer",
                  i === activeIndex ? "bg-surface-container-low text-primary-container" : "text-slate-800",
                )}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span aria-hidden className="text-slate-500">{item.icon}</span>
                  <span className="text-sm font-medium truncate">{item.label}</span>
                </span>
                {i === activeIndex && <CornerDownLeft aria-hidden className="w-4 h-4 shrink-0" />}
              </li>
            ))
          )}
        </ul>

        <div className="hidden sm:flex px-4 py-2.5 border-t border-border-subtle items-center gap-4 text-xs text-slate-500">
          <span>↑ ↓ to navigate</span>
          <span>Enter to open</span>
        </div>
      </div>
    </div>
  );
}
