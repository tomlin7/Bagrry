import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Convenience wrapper: `<Tooltip label="Search">{trigger}</Tooltip>`.
 * `shortcut` renders a dimmed key hint after the label, matching the reference UI.
 */
export function Tooltip({
  label,
  shortcut,
  side = "bottom",
  align = "center",
  delay,
  children,
}: {
  label: React.ReactNode;
  shortcut?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delay?: number;
  children: React.ReactNode;
}) {
  if (!label) return <>{children}</>;
  return (
    <TooltipPrimitive.Root delayDuration={delay ?? 350}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            "ui-pop z-[60] flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2 py-1 text-[11px] font-medium text-text shadow-md",
          )}
        >
          {label}
          {shortcut && <span className="text-subtle">{shortcut}</span>}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
