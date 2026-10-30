import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { EnhancedDoc, TranscriptSeg } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as Popover from "@radix-ui/react-popover";
import { formatElapsed } from "@/lib/format";
import { useAudioPlayerStore } from "@/store/audio";
import { useAppStore } from "@/store/app";
import { toast } from "@/components/ui/toast";
import { Play, Pause, ExternalLink, Copy, Check, Quote } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

function parseDoc(json: string | null): EnhancedDoc | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as EnhancedDoc;
    return Array.isArray(parsed?.sections) ? parsed : null;
  } catch {
    return null;
  }
}

/** Extracts any inline tokens such as [cite s_001, s_002] or [s_001] */
export function extractCitationIds(text: string, existing: string[] = []): { cleanText: string; citationIds: string[] } {
  const ids = new Set<string>(existing);
  const regex = /\[(?:cite\s+)?([a-zA-Z0-9_, -]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const tokens = match[1].split(/[, ]+/).map((t) => t.trim()).filter((t) => /^s_\d+$/i.test(t));
    for (const tok of tokens) ids.add(tok);
  }

  // Strip [cite s_001] tokens from display text if present so they don't look redundant
  const cleanText = text.replace(/\[cite\s+[a-zA-Z0-9_, -]+\]/g, "").replace(/\s{2,}/g, " ").trim();
  return { cleanText, citationIds: Array.from(ids) };
}

export function EnhancedNotes({
  noteId,
  json,
  onChange,
}: {
  noteId: string;
  json: string | null;
  onChange?: (json: string) => void;
}) {
  const doc = useMemo(() => parseDoc(json), [json]);
  const { data: segments = [] } = useQuery({
    queryKey: api.qk.segments(noteId),
    queryFn: () => api.listSegments(noteId),
  });

  const bySentenceId = useMemo(() => {
    const map = new Map<string, TranscriptSeg>();
    for (const segment of segments) map.set(segment.sentence_id, segment);
    return map;
  }, [segments]);

  const maxDurationMs = useMemo(() => {
    return segments.reduce((max, s) => Math.max(max, s.end_ms), 60000);
  }, [segments]);

  if (!doc) {
    return (
      <p className="text-[13px] text-subtle">
        Enhanced notes couldn&apos;t be read. Try running enhance again.
      </p>
    );
  }

  const copyBulletWithCitations = async (bulletText: string, citationIds: string[]) => {
    const quotes = citationIds
      .map((id) => bySentenceId.get(id))
      .filter((s): s is TranscriptSeg => Boolean(s))
      .map(
        (s) =>
          `  > "${s.text}" — ${s.speaker === "me" ? "Me" : "Attendees"} [${formatElapsed(s.start_ms)}]`,
      );

    let markdown = `• ${bulletText}`;
    if (quotes.length > 0) {
      markdown += `\n${quotes.join("\n")}`;
    }

    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Copied bullet & citation source to clipboard");
    } catch {
      toast.info("Quote", markdown);
    }
  };

  return (
    <div className="space-y-6">
      {doc.sections.map((section, index) => (
        <section key={`${section.section_title}-${index}`} className="group/section">
          <h3 className="font-display mb-2 text-[15px] font-semibold text-text">
            {section.section_title}
          </h3>
          <ul className="space-y-2">
            {section.bullet_points.map((bullet, bulletIndex) => {
              const { cleanText, citationIds } = extractCitationIds(bullet.text, bullet.citations);

              return (
                <li
                  key={bulletIndex}
                  className="group/bullet relative flex items-start gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-hover/20 text-[13px] leading-relaxed text-text"
                >
                  <span className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-accent/70" />

                  <div className="flex-1">
                    <span
                      contentEditable={Boolean(onChange)}
                      suppressContentEditableWarning
                      className={cn(
                        "outline-none",
                        onChange && "rounded-sm focus:bg-hover/50 focus:px-1",
                      )}
                      onBlur={(event) => {
                        if (!onChange || !doc) return;
                        const nextText = event.currentTarget.innerText.trim();
                        if (nextText === cleanText) return;
                        const next: EnhancedDoc = {
                          sections: doc.sections.map((sec, sIdx) =>
                            sIdx !== index
                              ? sec
                              : {
                                  ...sec,
                                  bullet_points: sec.bullet_points.map((item, bIdx) =>
                                    bIdx === bulletIndex ? { ...item, text: nextText } : item,
                                  ),
                                },
                          ),
                        };
                        onChange(JSON.stringify(next));
                      }}
                    >
                      {cleanText}
                    </span>

                    {/* Citations Badges */}
                    {citationIds.length > 0 && (
                      <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 align-baseline">
                        {citationIds.map((citation) => (
                          <Citation
                            key={citation}
                            id={citation}
                            noteId={noteId}
                            totalDurationMs={maxDurationMs}
                            segment={bySentenceId.get(citation) ?? null}
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  {/* Quick Copy Bullet Action on Hover */}
                  <div className="opacity-0 transition-opacity group-hover/bullet:opacity-100">
                    <Tooltip label="Copy bullet with citation">
                      <button
                        type="button"
                        aria-label="Copy bullet with citation"
                        onClick={() => copyBulletWithCitations(cleanText, citationIds)}
                        className="grid size-5 place-items-center rounded text-subtle transition-colors hover:bg-hover hover:text-text cursor-pointer"
                      >
                        <Quote className="size-3" />
                      </button>
                    </Tooltip>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Citation({
  id,
  noteId,
  totalDurationMs,
  segment,
}: {
  id: string;
  noteId: string;
  totalDurationMs: number;
  segment: TranscriptSeg | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPlaying = useAudioPlayerStore((s) => s.isPlaying);
  const currentTimeMs = useAudioPlayerStore((s) => s.currentTimeMs);
  const activeMeetingId = useAudioPlayerStore((s) => s.activeMeetingId);
  const playFrom = useAudioPlayerStore((s) => s.playFrom);
  const pause = useAudioPlayerStore((s) => s.pause);

  const setHighlightSentenceId = useAppStore((s) => s.setHighlightSentenceId);

  // Check if audio is currently playing this segment
  const isCurrentlyPlaying =
    isPlaying &&
    activeMeetingId === noteId &&
    segment !== null &&
    currentTimeMs >= segment.start_ms &&
    currentTimeMs <= segment.end_ms;

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!segment) return;
    if (isCurrentlyPlaying) {
      pause();
    } else {
      playFrom(noteId, segment.start_ms, segment.sentence_id, totalDurationMs);
    }
  };

  const handleViewInTranscript = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setHighlightSentenceId(id);
  };

  const handleCopyQuote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!segment) return;
    const speakerLabel = segment.speaker === "me" ? "Me" : "Attendees";
    const timestamp = formatElapsed(segment.start_ms);
    const quoteText = `> "${segment.text}"\n— ${speakerLabel} at ${timestamp}`;

    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      toast.success("Quote & citation copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info("Citation", quoteText);
    }
  };

  const displayIndex = id.replace(/\D/g, "").slice(-2) || id;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Citation ${id}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.2 text-[10px] font-medium leading-none align-baseline transition-all cursor-pointer shadow-2xs select-none",
            isCurrentlyPlaying
              ? "border-accent bg-accent text-white shadow-sm animate-pulse"
              : open
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-hover/40 text-muted hover:border-border-strong hover:bg-hover hover:text-text",
          )}
        >
          <span className="font-mono text-[9px]">cite</span>
          <span className="font-semibold">{displayIndex}</span>
          {segment && (
            <span className="font-mono text-[9px] opacity-75">
              {formatElapsed(segment.start_ms)}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={8}
          className="z-50 w-80 rounded-xl border border-border bg-elevated p-3.5 text-xs shadow-xl animate-pop-in backdrop-blur-xl"
        >
          {segment ? (
            <div className="space-y-3">
              {/* Header: Speaker & Timestamp range */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      segment.speaker === "me"
                        ? "bg-accent/15 text-accent"
                        : "bg-surface-3 text-subtle",
                    )}
                  >
                    {segment.speaker === "me" ? "Speaker: Me" : "Speaker: Attendees"}
                  </span>
                </div>

                <span className="font-mono text-[11px] text-subtle">
                  {formatElapsed(segment.start_ms)} – {formatElapsed(segment.end_ms)}
                </span>
              </div>

              {/* Verbatim Sentence */}
              <div className="rounded-lg bg-surface-2 p-2.5 text-text">
                <p className="leading-relaxed italic text-[12.5px]">
                  &ldquo;{segment.text}&rdquo;
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer",
                    isCurrentlyPlaying
                      ? "bg-accent text-white"
                      : "bg-accent/10 text-accent hover:bg-accent/20",
                  )}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause className="size-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5 fill-current" />
                      <span>Play from here</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <Tooltip label="View in transcript">
                    <button
                      type="button"
                      aria-label="View in transcript"
                      onClick={handleViewInTranscript}
                      className="grid size-7 place-items-center rounded-lg border border-border bg-hover/30 text-muted transition-colors hover:border-border-strong hover:text-text cursor-pointer"
                    >
                      <ExternalLink className="size-3.5" />
                    </button>
                  </Tooltip>

                  <Tooltip label="Copy quote & citation">
                    <button
                      type="button"
                      aria-label="Copy quote & citation"
                      onClick={handleCopyQuote}
                      className="grid size-7 place-items-center rounded-lg border border-border bg-hover/30 text-muted transition-colors hover:border-border-strong hover:text-text cursor-pointer"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-1 text-center">
              <p className="text-subtle text-[12px]">Source line ({id}) not found in this transcript.</p>
            </div>
          )}

          <Popover.Arrow className="fill-[color:var(--elevated)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
