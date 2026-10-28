import { useEffect, useRef } from "react";
import * as api from "@/lib/api";
import { parseDbDate } from "@/lib/format";
import { useAppStore } from "@/store/app";
import { toast } from "@/components/ui/toast";

/** Fires a toast ~1 minute before each calendar event when the preference is on. */
export function useMeetingReminders() {
  const notified = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const enabled = await api.getSetting("notify_meeting_start");
        if (cancelled || enabled === "0") return;
        const events = await api.listCalendar();
        const now = Date.now();
        for (const event of events) {
          const start = parseDbDate(event.start_at);
          if (!start) continue;
          const delta = start.getTime() - now;
          if (delta > 45_000 && delta < 90_000 && !notified.current.has(event.id)) {
            notified.current.add(event.id);
            toast.info("Meeting starting soon", event.title);
          }
        }
      } catch {
        /* calendar optional */
      }
    };

    const id = window.setInterval(() => void tick(), 30_000);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
}

/** Toast when recording starts, if auto-detected notifications are enabled. */
export function useRecordingStartToast() {
  const recState = useAppStore((s) => s.recState);
  const prev = useRef(recState);

  useEffect(() => {
    if (prev.current === "idle" && recState === "recording") {
      api.getSetting("notify_auto_detected").then((v) => {
        if (v !== "0") toast.info("Bagrry is recording", "Transcription is running in the background.");
      }).catch(() => undefined);
    }
    prev.current = recState;
  }, [recState]);
}
