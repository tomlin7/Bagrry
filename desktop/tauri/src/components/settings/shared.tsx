import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function TabHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text">{title}</h1>
        {description && <p className="mt-1 text-sm text-subtle font-normal">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function AccentLink({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("text-[13px] font-medium text-accent transition-colors hover:text-accent-hover", className)}
    >
      {children}
    </button>
  );
}

export function ChevronValue({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[13px] text-muted">
      {children}
      <ChevronRight className="size-3.5" />
    </span>
  );
}

export function SettingsField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex items-start gap-4 px-4 py-3">
      <span className="w-[9.75rem] shrink-0 pt-2 text-[13px] text-text">{label}</span>
      <span className="min-w-0 flex-1">
        {children}
        {hint && <span className="mt-1 block text-xs text-subtle">{hint}</span>}
      </span>
    </label>
  );
}
