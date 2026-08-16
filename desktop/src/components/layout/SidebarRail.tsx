import type { CSSProperties, ReactNode } from "react";
import { SIDEBAR_WIDTH } from "@/lib/motion";

/**
 * Keeps the sidebar mounted and slides it with CSS.
 * Unmounting through AnimatePresence skipped the exit tween, so the rail
 * vanished in one frame.
 */
export function SidebarRail({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className="sidebar-rail"
      data-open={open ? "true" : "false"}
      style={{ "--sidebar-width": `${SIDEBAR_WIDTH}px` } as CSSProperties}
    >
      <div className="sidebar-rail-inner" inert={!open} aria-hidden={!open}>
        {children}
      </div>
    </div>
  );
}
