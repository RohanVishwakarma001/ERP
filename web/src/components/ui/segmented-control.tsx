"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { clsx } from "clsx";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
  /** Accessible name for the tab list. */
  label?: string;
}

/**
 * iOS-style segmented tabs. Follows the WAI-ARIA tabs pattern: one tab stop,
 * arrow keys / Home / End move between tabs. Scrolls horizontally on narrow screens.
 */
export function SegmentedControl<T extends string>({ value, onChange, options, label = "Sections" }: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = options.length - 1;
    const next = e.key === "ArrowRight" ? (index === last ? 0 : index + 1) : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar">
      {options.map((option, i) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={clsx(
              "flex-1 min-w-fit h-9 px-3 rounded-lg text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors",
              selected ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900 font-medium",
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
