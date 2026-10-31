import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Minus, Search, ThumbsDown, X, Play, Pause, UserCheck } from "lucide-react";
import * as api from "@/lib/api";
import { formatElapsed } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { useAudioPlayerStore } from "@/store/audio";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecordingControls } from "./RecordingControls";
import { AnimatePresence, motion } from "framer-motion";
import { snappy } from "@/lib/motion";
import { useBoolSetting } from "@/hooks/useSetting";

/**
 * The floating transcript card that sits over the editor while a note is live or viewed.
 * Supports deep-link sentence jumping with animated highlighting and audio scrubbing.
 */
export function TranscriptPanel({ noteId }: { noteId: string }) {
  const recState = useAppStore((s) => s.recState);
  const minimized = useAppStore((s) => s.transcriptMinimized);
  const setMinimized = useAppStore((s) => s.setTranscriptMinimized);
  const setOpen = useAppStore((s) => s.setTranscriptOpen);
  const startedAt = useAppStore((s) => s.recordingStartedAt);
  const liveSegments = useAppStore((s) => s.liveSegments);
  const highlightSentenceId = useAppStore((s) => s.highlightSentenceId);
  const setHighlightSentenceId = useAppStore((s) => s.setHighlightSentenceId);

  const isAudioPlaying = useAudioPlayerStore((s) => s.isPlaying);
  const audioCurrentTimeMs = useAudioPlayerStore((s) => s.currentTimeMs);
  const audioActiveMeetingId = useAudioPlayerStore((s) => s.activeMeetingId);
  const playFrom = useAudioPlayerStore((s) => s.playFrom);
  const pauseAudio = useAudioPlayerStore((s) => s.pause);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [speakerTags] = useBoolSetting("speaker_tags", true);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: attendees = [] } = useQuery({
    queryKey: api.qk.attendees(noteId),
    queryFn: () => api.listMeetingAttendees(noteId),
  });

  const assignSpeakerMutation = useMutation({
    mutationFn: ({ speakerSource, speakerName }: { speakerSource: string; speakerName: string }) =>
      api.assignSpeakerName(noteId, speakerSource, speakerName),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.segments(noteId) });
      toast.success(`Attributed spoken turns to ${vars.speakerName}`);
    },
    onError: (e) => toast.error(e),
  });

  const { data: segments = [] } = useQuery({
    queryKey: api.qk.segments(noteId),
    queryFn: () => api.listSegments(noteId),
    refetchInterval: recState === "recording" ? 4000 : false,
  });

  const maxDurationMs = useMemo(() => {
    return segments.reduce((max, s) => Math.max(max, s.end_ms), 60000);
  }, [segments]);

  const filtered = useMemo(() => {
    const source =
      recState !== "idle" && liveSegments.length > 0
        ? liveSegments
        : recState !== "idle"
          ? [...segments, ...liveSegments]
          : segments;
    if (!query.trim()) return source;
    const needle = query.toLowerCase();
    return source.filter((s) => s.text.toLowerCase().includes(needle));
  }, [segments, liveSegments, recState, query]);

  // Deep-link scroll to highlighted sentence from citation click
  useEffect(() => {
    if (!highlightSentenceId || minimized) return;

    setPulseId(highlightSentenceId);
    const timer = setTimeout(() => {
      const el = document.getElementById(`seg-${highlightSentenceId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    const clearPulse = setTimeout(() => {
      setPulseId(null);
      setHighlightSentenceId(null);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearPulse);
    };
  }, [highlightSentenceId, minimized, setHighlightSentenceId]);

  useEffect(() => {
    if (!query && !highlightSentenceId) {
      scrollRef.current?.scrollTo?.({ top: scrollRef.current.scrollHeight });
    }
  }, [filtered.length, query, highlightSentenceId]);

  const copyAll = async () => {
    const rows = filtered.length ? filtered : segments;
    const text = rows
      .map(
        (s) =>
          `[${formatElapsed(s.start_ms)}] ${s.speaker === "me" ? "Me" : "Them"}: ${s.text}`,
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Transcript copied with timestamps");
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="pointer-events-auto mx-auto w-full max-w-[620px]">
      <AnimatePresence mode="wait" initial={false}>
        {minimized ? (
          <motion.div
            key="minimized"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={snappy}
          >
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 shadow-lg">
              <RecordingControls noteId={noteId} compact />
              <button
                type="button"
                onClick={() => setMinimized(false)}
                className="flex-1 truncate text-left text-xs text-muted transition-colors hover:text-text cursor-pointer"
              >
                {recState === "recording" ? "Transcribing…" : "Verbatim Transcript"}
                {startedAt && recState !== "idle" && (
                  <span className="ml-2 tabular text-subtle">
                    <Elapsed startedAt={startedAt} />
                  </span>
                )}
              </button>
              <Tooltip label="Close">
                <button
                  type="button"
                  aria-label="Close transcript"
                  onClick={() => setOpen(false)}
                  className="grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-hover hover:text-text cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </Tooltip>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={snappy}
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
                {searching ? (
                  <input
                    autoFocus
                    value={query}
                    placeholder="Search transcript by keyword or sentence..."
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => !query && setSearching(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setQuery("");
                        setSearching(false);
                      }
                    }}
                    className="h-6 flex-1 bg-transparent text-xs text-text outline-none placeholder:text-subtle"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label="Search transcript"
                      onClick={() => setSearching(true)}
                      className="grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-hover hover:text-text cursor-pointer"
                    >
                      <Search className="size-3.5" />
                    </button>
                    <span className="font-display text-[12px] font-semibold text-text">
                      Verbatim Transcript
                    </span>
                    <span className="font-mono text-[10px] text-subtle">
                      ({filtered.length} {filtered.length === 1 ? "line" : "lines"})
                    </span>
                    <div className="flex-1" />
                  </>
                )}

                <PanelAction
                  label="Report a problem"
                  icon={ThumbsDown}
                  onClick={() => toast.info("Thanks — feedback noted")}
                />
                <PanelAction
                  label="Copy transcript"
                  icon={Copy}
                  onClick={() => void copyAll()}
                />
                <PanelAction
                  label="Minimise"
                  icon={Minus}
                  onClick={() => setMinimized(true)}
                />
              </div>

              <div ref={scrollRef} className="h-[280px] overflow-y-auto px-4 py-2 space-y-1">
                {filtered.length === 0 ? (
                  <div className="grid h-full place-items-center text-center">
                    <p className="text-[13px] text-subtle">
                      {query
                        ? "No matching transcript lines found"
                        : recState === "recording" || recState === "paused"
                          ? "Listening… speech will appear shortly with sentence citations"
                          : "Nothing transcribed yet"}
                    </p>
                  </div>
                ) : (
                  filtered.map((segment) => {
                    const isSentenceHighlighted =
                      pulseId === segment.sentence_id || pulseId === segment.id;

                    const isAudioOnThisSeg =
                      isAudioPlaying &&
                      audioActiveMeetingId === noteId &&
                      audioCurrentTimeMs >= segment.start_ms &&
                      audioCurrentTimeMs <= segment.end_ms;

                    return (
                      <div
                        id={`seg-${segment.sentence_id}`}
                        key={segment.id || segment.sentence_id}
                        className={cn(
                          "group/row relative flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] leading-relaxed transition-all duration-300",
                          isSentenceHighlighted
                            ? "bg-accent/20 ring-2 ring-accent"
                            : isAudioOnThisSeg
                              ? "bg-accent/10 border-l-2 border-accent"
                              : "hover:bg-hover/40",
                        )}
                      >
                        {/* Play button hover action */}
                        <button
                          type="button"
                          aria-label={`Play sentence ${segment.sentence_id}`}
                          onClick={() => {
                            if (isAudioOnThisSeg) {
                              pauseAudio();
                            } else {
                              playFrom(noteId, segment.start_ms, segment.sentence_id, maxDurationMs);
                            }
                          }}
                          className={cn(
                            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full transition-opacity cursor-pointer",
                            isAudioOnThisSeg
                              ? "bg-accent text-white opacity-100"
                              : "text-subtle hover:bg-hover hover:text-text opacity-0 group-hover/row:opacity-100",
                          )}
                        >
                          {isAudioOnThisSeg ? (
                            <Pause className="size-2.5 fill-current" />
                          ) : (
                            <Play className="ml-0.5 size-2.5 fill-current" />
                          )}
                        </button>

                        {/* Speaker tag with Attribution Popover */}
                        {speakerTags && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "shrink-0 pt-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors hover:underline cursor-pointer",
                                  segment.speaker_name
                                    ? "text-blue-500 dark:text-blue-400 font-bold"
                                    : segment.speaker === "me"
                                      ? "text-accent"
                                      : "text-subtle hover:text-text",
                                )}
                                title="Click to attribute speaker turn"
                                aria-label={`Attribute speaker ${segment.speaker_name || (segment.speaker === "me" ? "Me" : "Them")}`}
                              >
                                {segment.speaker_name || (segment.speaker === "me" ? "Me" : "Them")}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[13rem]">
                              <DropdownMenuLabel>Attribute Speaker</DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={() =>
                                  assignSpeakerMutation.mutate({
                                    speakerSource: segment.speaker,
                                    speakerName: "Me",
                                  })
                                }
                              >
                                <span className="font-semibold text-accent">Me (Host)</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {attendees.length > 0 && (
                                <>
                                  <DropdownMenuLabel className="text-[10px] text-subtle">
                                    Meeting Attendees
                                  </DropdownMenuLabel>
                                  {attendees.map((att) => (
                                    <DropdownMenuItem
                                      key={att.id}
                                      onSelect={() =>
                                        assignSpeakerMutation.mutate({
                                          speakerSource: segment.speaker,
                                          speakerName: att.name,
                                        })
                                      }
                                    >
                                      <UserCheck className="mr-2 size-3 text-subtle" />
                                      <span>{att.name}</span>
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onSelect={() => {
                                  const customName = window.prompt("Enter speaker name (e.g. Sarah Connor):");
                                  if (customName && customName.trim()) {
                                    assignSpeakerMutation.mutate({
                                      speakerSource: segment.speaker,
                                      speakerName: customName.trim(),
                                    });
                                  }
                                }}
                              >
                                <span>Custom Speaker…</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {/* Text Content */}
                        <span className="flex-1 text-text">{segment.text}</span>

                        {/* Timestamp Pill */}
                        <span className="shrink-0 pt-0.5 font-mono text-[10px] text-subtle opacity-70 group-hover/row:opacity-100">
                          {formatElapsed(segment.start_ms)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mx-3 mb-2 rounded-lg bg-hover px-3 py-1.5 text-center text-[11px] text-subtle">
                Always get consent when transcribing others.{" "}
                <button
                  type="button"
                  className="text-muted underline-offset-2 hover:underline cursor-pointer"
                  onClick={() => {
                    void api.copyConsent().then(
                      (text) =>
                        navigator.clipboard.writeText(text).then(
                          () => toast.success("Consent message copied"),
                          () => toast.info(text),
                        ),
                      (e) => toast.error(e),
                    );
                  }}
                >
                  Copy consent
                </button>
              </div>

              <div className="border-t border-border px-3 py-2">
                <RecordingControls noteId={noteId} />
              </div>
            </div>

            <p className="mt-2 text-center text-[11px] text-subtle">
              Bagrry transcript with verbatim citation grounding.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Copy;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-hover hover:text-text cursor-pointer"
      >
        <Icon className="size-3.5" />
      </button>
    </Tooltip>
  );
}

export function Elapsed({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{formatElapsed(now - startedAt)}</>;
}
