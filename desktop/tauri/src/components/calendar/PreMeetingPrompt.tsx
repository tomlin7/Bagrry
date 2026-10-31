import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Video,
  Clock,
  X,
  Radio,
  ExternalLink,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
} from "lucide-react";
import * as api from "@/lib/api";
import { parseDbDate, formatTime } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";
import { extractConferenceUrl, parseAttendeesList, isEventStartingSoonOrActive } from "@/lib/calendar";
import { useCreateNote } from "@/hooks/useCreateNote";
import { useAppStore } from "@/store/app";
import { useBoolSetting } from "@/hooks/useSetting";
import { Button } from "@/components/ui/button";

export function PreMeetingPrompt() {
  const createNote = useCreateNote();
  const recState = useAppStore((s) => s.recState);
  const [autoRecord] = useBoolSetting("calendar_auto_record", false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [now, setNow] = useState(Date.now());
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [autoTriggeredId, setAutoTriggeredId] = useState<string | null>(null);

  // Poll clock every 10s to update prompts
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: api.qk.calendar(),
    queryFn: api.listCalendar,
    refetchInterval: 30000,
  });

  // Find the most urgent upcoming or active event within a 5-minute window
  const candidateEvent = useMemo(() => {
    if (recState === "recording") return null;

    for (const ev of events) {
      if (dismissedIds.has(ev.id)) continue;
      const start = parseDbDate(ev.start_at);
      if (!start) continue;
      const end = parseDbDate(ev.end_at);

      const check = isEventStartingSoonOrActive(start, end, now, 5);
      if (check.status === "starting_soon" || check.status === "ongoing") {
        return {
          event: ev,
          start,
          status: check.status,
          deltaMs: check.deltaMs,
          conference: extractConferenceUrl(ev.title + " " + ev.attendees_json),
          attendees: parseAttendeesList(ev),
        };
      }
    }
    return null;
  }, [events, dismissedIds, now, recState]);

  const handleRecord = useCallback((eventToRecord?: CalendarEvent, confUrl?: string | null) => {
    const targetEvent = eventToRecord || candidateEvent?.event;
    if (!targetEvent) return;

    setDismissedIds((prev) => new Set(prev).add(targetEvent.id));

    // Create note, link attendees and start recording
    createNote.mutate({
      title: targetEvent.title,
      record: true,
    });

    const url = confUrl !== undefined ? confUrl : candidateEvent?.conference.url;
    if (url) {
      window.open(url, "_blank");
    }
  }, [candidateEvent, createNote]);

  // Automated trigger when auto-record is enabled
  useEffect(() => {
    if (!autoRecord || !candidateEvent || recState !== "idle") return;
    if (autoTriggeredId === candidateEvent.event.id) return;

    // Trigger auto-record if ongoing or starting in <= 10s
    if (
      candidateEvent.status === "ongoing" ||
      (candidateEvent.status === "starting_soon" && candidateEvent.deltaMs <= 10000)
    ) {
      setAutoTriggeredId(candidateEvent.event.id);
      handleRecord(candidateEvent.event, candidateEvent.conference.url);
    }
  }, [autoRecord, candidateEvent, recState, autoTriggeredId, handleRecord]);

  if (!candidateEvent) return null;

  const { event, start, status, deltaMs, conference, attendees } = candidateEvent;

  const handleDismiss = () => {
    setDismissedIds((prev) => new Set(prev).add(event.id));
  };

  const handleToggleBriefing = async () => {
    if (briefingOpen) {
      setBriefingOpen(false);
      return;
    }
    setBriefingOpen(true);
    if (!briefingText) {
      setLoadingBrief(true);
      try {
        const brief = await api.preMeetingBrief(event.attendees_json || "[]");
        setBriefingText(brief || "No previous meeting records or open commitments found for attendees.");
      } catch {
        setBriefingText("Unable to generate briefing at this time.");
      } finally {
        setLoadingBrief(false);
      }
    }
  };

  const timeLabel =
    status === "starting_soon"
      ? `Starting in ${Math.max(1, Math.ceil(deltaMs / 60000))} min`
      : `Started ${Math.max(1, Math.floor(deltaMs / 60000))}m ago`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl border border-border/80 bg-surface-1/95 p-4 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header: Provider badge & dismiss */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex size-2 rounded-full bg-accent animate-ping" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
              {conference.provider === "zoom"
                ? "Zoom Meeting"
                : conference.provider === "meet"
                  ? "Google Meet"
                  : conference.provider === "teams"
                    ? "Microsoft Teams"
                    : "Scheduled Sync"}
            </span>
            {autoRecord && (
              <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-accent/15 text-accent">
                <Zap className="size-2.5" />
                Auto-record on
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Dismiss meeting prompt"
            onClick={handleDismiss}
            className="grid size-5 place-items-center rounded-md text-subtle hover:bg-hover hover:text-text cursor-pointer transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Meeting Title & Meta */}
        <div className="space-y-1">
          <h4 className="font-display text-[14px] font-semibold text-text leading-snug line-clamp-1">
            {event.title}
          </h4>

          <div className="flex items-center gap-3 text-[11px] text-muted font-mono">
            <span className="flex items-center gap-1 text-accent font-medium">
              <Clock className="size-3" />
              <span>{timeLabel}</span>
            </span>
            <span className="text-subtle">·</span>
            <span>{formatTime(start)}</span>
          </div>

          {attendees.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-subtle pt-0.5">
              <div className="flex items-center gap-1 truncate max-w-[240px]">
                <Users className="size-3 text-subtle shrink-0" />
                <span className="truncate">
                  {attendees.map((a) => a.name).slice(0, 3).join(", ")}
                  {attendees.length > 3 ? ` +${attendees.length - 3}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleBriefing}
                className="flex items-center gap-1 text-[10px] text-accent font-medium hover:underline cursor-pointer"
              >
                <Sparkles className="size-3" />
                <span>{briefingOpen ? "Hide Brief" : "Catch Me Up"}</span>
                {briefingOpen ? <ChevronUp className="size-2.5" /> : <ChevronDown className="size-2.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Attendee Intelligence & Catch Me Up Drawer */}
        <AnimatePresence>
          {briefingOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mt-2.5 overflow-hidden rounded-xl border border-border/70 bg-surface-2/80 p-3 text-xs"
            >
              <div className="flex items-center gap-1.5 pb-1 font-mono text-[10px] uppercase font-semibold text-accent">
                <Sparkles className="size-3" />
                <span>Pre-Call Briefing & Open Loops</span>
              </div>
              {loadingBrief ? (
                <div className="flex items-center gap-2 py-3 text-muted">
                  <Loader2 className="size-3.5 animate-spin text-accent" />
                  <span>Synthesizing past decisions & open loops...</span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-text/90 text-[11px]">
                  {briefingText}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-3.5 flex items-center gap-2 pt-1 border-t border-border/60">
          <Button
            variant="solid"
            size="sm"
            onClick={() => handleRecord()}
            className="flex-1 gap-1.5 cursor-pointer shadow-sm text-xs"
          >
            <Radio className="size-3.5 text-white animate-pulse" />
            <span>Record with Bagrry</span>
          </Button>

          {conference.url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(conference.url!, "_blank")}
              className="gap-1 cursor-pointer text-xs"
            >
              <Video className="size-3.5" />
              <ExternalLink className="size-2.5 opacity-60" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-subtle hover:text-text cursor-pointer text-xs px-2"
          >
            Dismiss
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
