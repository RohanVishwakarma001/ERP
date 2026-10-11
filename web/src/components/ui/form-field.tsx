import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { clsx } from "clsx";

export const CONTROL_CLASSES =
  "w-full px-3 rounded-xl border border-border-strong bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors hover:border-slate-400 focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/10 disabled:opacity-60 disabled:bg-slate-50 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/10";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  /** Marks the label as optional instead of relying on placeholder text. */
  optional?: boolean;
  children: ReactNode;
}

/**
 * Label + control + hint/error. The control gets an id, `aria-describedby` and
 * `aria-invalid` wired automatically so screen readers announce hints and errors.
 */
export function Field({ label, error, hint, optional, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const child = Children.only(children);
  const control = isValidElement(child)
    ? cloneElement(child as ReactElement<Record<string, unknown>>, {
        id: (child.props as { id?: string }).id ?? id,
        "aria-describedby": error || hint ? messageId : undefined,
        "aria-invalid": error ? true : undefined,
      })
    : child;
  const controlId = isValidElement(child) ? ((child.props as { id?: string }).id ?? id) : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={controlId} className="flex items-baseline justify-between text-sm font-medium text-slate-800">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-slate-500">Optional</span>}
      </label>
      {control}
      {error ? (
        <p id={messageId} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={clsx(CONTROL_CLASSES, "h-10", className)} {...props} />;
});

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function SelectInput(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={clsx(CONTROL_CLASSES, "h-10 pr-8", className)} {...props} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={clsx(CONTROL_CLASSES, "py-2.5 min-h-[96px] resize-y", className)} {...props} />;
});

/** Checkbox with a large, labelled hit area. */
export function Checkbox({ label, description, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className="flex items-start gap-3 text-sm text-slate-800 cursor-pointer select-none">
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border-strong accent-primary-container" {...props} />
      <span>
        <span className="font-medium">{label}</span>
        {description && <span className="block text-xs text-slate-500 mt-0.5">{description}</span>}
      </span>
    </label>
  );
}
