import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/lib/api";
import { currentWindow } from "@/lib/tauri";
import { useAppStore } from "@/store/app";
import { Elapsed } from "@/components/notes/TranscriptPanel";

/** Granola-style pill on the right while a meeting is being transcribed. */
export function LiveMeetingIndicator() {
  const recState = useAppStore((s) => s.recState);
  const startedAt = useAppStore((s) => s.recordingStartedAt);
  const { data: enabled = "1" } = useQuery({
    queryKey: api.qk.settings(["live_indicator"]),
    queryFn: async () => (await api.getSetting("live_indicator")) || "1",
    staleTime: 5_000,
  });
  const visible = enabled === "1" && recState !== "idle";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          className="pointer-events-none fixed right-4 top-1/2 z-[60] -translate-y-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1.5 shadow-lg">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-danger" />
            </span>
            <span className="text-[12px] font-medium text-text">
              {recState === "paused" ? "Paused" : "Recording"}
            </span>
            {startedAt && (
              <span className="tabular text-[11px] text-subtle">
                <Elapsed startedAt={startedAt} />
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * When "Reposition Bagrry for meetings" is on, slide the window to the
 * top-right while recording and restore it afterwards.
 */
export function useRepositionForMeetings() {
  const recState = useAppStore((s) => s.recState);
  const saved = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    api.getSetting("reposition_for_meetings").then((v) => setEnabled(v !== "0")).catch(() => undefined);
  }, [recState]);

  useEffect(() => {
    const win = currentWindow();
    if (!win || !enabled) return;

    if (recState === "recording" && !saved.current) {
      void (async () => {
        try {
          const pos = await win.outerPosition();
          const size = await win.outerSize();
          saved.current = { x: pos.x, y: pos.y, w: size.width, h: size.height };
          const monitor = await (await import("@tauri-apps/api/window")).currentMonitor();
          if (!monitor) return;
          const { PhysicalPosition } = await import("@tauri-apps/api/dpi");
          const area = monitor.workArea;
          const targetX = Math.max(area.position.x, area.position.x + area.size.width - size.width - 24);
          const targetY = area.position.y + 24;
          await win.setPosition(new PhysicalPosition(targetX, targetY));
        } catch {
          /* window APIs unavailable */
        }
      })();
    }

    if (recState === "idle" && saved.current) {
      const { x, y } = saved.current;
      saved.current = null;
      void (async () => {
        try {
          const { PhysicalPosition } = await import("@tauri-apps/api/dpi");
          await win.setPosition(new PhysicalPosition(x, y));
        } catch {
          /* ignore */
        }
      })();
    }
  }, [recState, enabled]);
}
