import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Minus, Search, ThumbsDown, X } from "lucide-react";
import * as api from "@/lib/api";
import { formatElapsed } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { RecordingControls } from "./RecordingControls";
import { AnimatePresence, motion } from "framer-motion";
import { snappy } from "@/lib/motion";
import { useBoolSetting } from "@/hooks/useSetting";

/**
 * The floating transcript card that sits over the editor while a note is live.
 * Collapses to a slim bar when minimised so the recorder stays reachable.
 */
export function TranscriptPanel({ noteId }: { noteId: string }) {
  const recState = useAppStore((s) => s.recState);
  const minimized = useAppStore((s) => s.transcriptMinimized);
  const setMinimized = useAppStore((s) => s.setTranscriptMinimized);
  const setOpen = useAppStore((s) => s.setTranscriptOpen);
  const startedAt = useAppStore((s) => s.recordingStartedAt);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [speakerTags] = useBoolSetting("speaker_tags", true);

  const { data: segments = [] } = useQuery({
    queryKey: api.qk.segments(noteId),
    queryFn: () => api.listSegments(noteId),
    // While recording, new segments only land after transcription, so a slow
    // poll is enough to keep the panel fresh without hammering SQLite.
    refetchInterval: recState === "recording" ? 4000 : false,
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return segments;
    const needle = query.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(needle));
  }, [segments, query]);

  useEffect(() => {
    if (!query) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [filtered.length, query]);

  const copyAll = async () => {
    const text = segments.map((s) => `${s.speaker === "me" ? "Me" : "Them"}: ${s.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Transcript copied");
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <div className="pointer-events-auto mx-auto w-full max-w-[576px]">
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
                className="flex-1 truncate text-left text-xs text-muted transition-colors hover:text-text"
              >
                {recState === "recording" ? "Transcribing…" : "Transcript"}
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
                  className="grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-hover hover:text-text"
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
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-xl">
              <div className="flex items-center gap-2 px-3 py-2">
                {searching ? (
                  <input
                    autoFocus
                    value={query}
                    placeholder="Search transcript"
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
                      className="grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-hover hover:text-text"
                    >
                      <Search className="size-3.5" />
                    </button>
                    <div className="flex-1" />
                  </>
                )}

                <PanelAction label="Report a problem" icon={ThumbsDown} onClick={() => toast.info("Thanks — feedback noted")} />
                <PanelAction label="Copy transcript" icon={Copy} onClick={() => void copyAll()} />
                <PanelAction label="Minimise" icon={Minus} onClick={() => setMinimized(true)} />
              </div>

              <div ref={scrollRef} className="h-[240px] overflow-y-auto px-4">
                {filtered.length === 0 ? (
                  <div className="grid h-full place-items-center text-center">
                    <p className="text-[13px] text-subtle">
                      {query
                        ? "No matching lines"
                        : recState === "recording"
                          ? "Transcript starting…"
                          : "Nothing transcribed yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    {filtered.map((segment) => (
                      <div key={segment.id} className="flex gap-2 text-[13px] leading-relaxed">
                        {speakerTags && (
                          <span
                            className={cn(
                              "shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              segment.speaker === "me" ? "text-accent" : "text-subtle",
                            )}
                          >
                            {segment.speaker === "me" ? "Me" : "Them"}
                          </span>
                        )}
                        <span className="text-text">{segment.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mx-3 mb-2 rounded-lg bg-hover px-3 py-1.5 text-center text-[11px] text-subtle">
                Always get consent when transcribing others.{" "}
                <button
                  type="button"
                  className="text-muted underline-offset-2 hover:underline"
                  onClick={() => {
                    void api.copyConsent().then(
                      (text) => navigator.clipboard.writeText(text).then(
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

            <p className="mt-2 text-center text-[11px] text-subtle">Bagrry uses AI and can make mistakes.</p>
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
        className="grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-hover hover:text-text"
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
