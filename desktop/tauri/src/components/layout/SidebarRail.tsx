import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { SIDEBAR_WIDTH, sidebarTween } from "@/lib/motion";

export function SidebarRail({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ width: open ? SIDEBAR_WIDTH : 0 }}
      transition={sidebarTween}
      className="h-full min-w-0 shrink-0 overflow-hidden"
      data-open={open ? "true" : "false"}
    >
      <div className="h-full" style={{ width: SIDEBAR_WIDTH }} inert={!open} aria-hidden={!open}>
        {children}
      </div>
    </motion.div>
  );
}
