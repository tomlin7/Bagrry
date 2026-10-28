import * as React from "react";
import { cn } from "@/lib/utils";
import { initials as toInitials } from "@/lib/format";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return (
    <div
      role="separator"
      className={cn(vertical ? "w-px self-stretch" : "h-px w-full", "shrink-0 bg-border", className)}
    />
  );
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border bg-hover px-1 font-sans text-[10px] font-medium text-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "danger" | "success";
  className?: string;
}) {
  const tones = {
    neutral: "bg-hover text-muted",
    accent: "bg-accent-subtle text-accent",
    danger: "bg-danger/15 text-danger",
    success: "bg-success/15 text-success",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const AVATAR_TINTS = [
  "#c0552f",
  "#3f7a5e",
  "#4a6fa5",
  "#8a5ba8",
  "#a8813a",
  "#b04a6d",
  "#3f7f8a",
] as const;

function tintFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

export function Avatar({
  name,
  src,
  size = 24,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const showImage = src && !failed;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.4)),
        background: showImage ? undefined : tintFor(name || "?"),
      }}
      title={name}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        toInitials(name)
      )}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  dashed = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  dashed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl px-6 py-10 text-center",
        dashed && "border border-dashed border-border",
        className,
      )}
    >
      {icon && <div className="text-subtle [&_svg]:size-5">{icon}</div>}
      <p className="text-[13px] font-medium text-muted">{title}</p>
      {description && <p className="max-w-xs text-xs text-subtle">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Section heading used above note lists ("Today", "Recents", "Recipes"). */
export function SectionLabel({
  children,
  className,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between px-1 pb-1", className)}>
      <span className="text-[11px] font-semibold tracking-wide text-subtle">{children}</span>
      {action}
    </div>
  );
}
