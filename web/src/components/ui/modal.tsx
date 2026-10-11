"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { clsx } from "clsx";
import { X } from "lucide-react";
import { Button, type ButtonVariant } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Sticky action row at the bottom (stays visible while the body scrolls). */
  footer?: ReactNode;
  children: ReactNode;
}

const SIZES = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg", xl: "sm:max-w-2xl" };
/** Open dialogs, innermost last — only the top one reacts to Escape / Tab. */
const modalStack: symbol[] = [];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog. Bottom sheet on phones, centred card from `sm` up.
 * Escape and backdrop click close it; focus moves in on open, is kept inside
 * while open, and returns to the trigger on close; the page behind can't scroll.
 */
export function Modal({ open, onClose, title, description, icon, size = "md", footer, children }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const token = Symbol("modal");
    modalStack.push(token);
    const isTop = () => modalStack[modalStack.length - 1] === token;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Focus the first form control if there is one, else the panel itself.
    const panel = panelRef.current;
    const firstField = panel?.querySelector<HTMLElement>("input, select, textarea");
    (firstField ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === "Escape") {
        onCloseRef.current();
      } else if (e.key === "Tab" && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      modalStack.splice(modalStack.indexOf(token), 1);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="presentation">
      <div aria-hidden className="absolute inset-0 bg-black/40 animate-in fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={clsx(
          "relative w-full bg-white shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh] outline-none",
          "rounded-t-2xl sm:rounded-2xl animate-in slide-in-from-bottom-2 sm:zoom-in-95 fade-in",
          SIZES[size],
        )}
      >
        <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-border-subtle">
          <div className="flex items-start gap-3 min-w-0">
            {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-slate-900 font-headline">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-xs text-slate-500 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-border-subtle flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Sticky footer row for forms rendered inside a Modal body. */
export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 mt-2 border-t border-border-subtle">{children}</div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Explicit second step for destructive or irreversible actions. */
export function ConfirmDialog({ open, title, message, confirmLabel, confirmVariant = "primary", loading, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-700 leading-relaxed">{message}</div>
    </Modal>
  );
}
