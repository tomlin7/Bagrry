import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { EnhancedDoc, TranscriptSeg } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as Popover from "@radix-ui/react-popover";

function parseDoc(json: string | null): EnhancedDoc | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as EnhancedDoc;
    return Array.isArray(parsed?.sections) ? parsed : null;
  } catch {
    return null;
  }
}

export function EnhancedNotes({ noteId, json }: { noteId: string; json: string | null }) {
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

  if (!doc) {
    return (
      <p className="text-[13px] text-subtle">
        Enhanced notes couldn&apos;t be read. Try running enhance again.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {doc.sections.map((section, index) => (
        <section key={`${section.section_title}-${index}`}>
          <h3 className="font-display mb-1.5 text-[15px] font-semibold text-text">
            {section.section_title}
          </h3>
          <ul className="space-y-1.5">
            {section.bullet_points.map((bullet, bulletIndex) => (
              <li key={bulletIndex} className="flex gap-2 text-[13px] leading-relaxed text-text">
                <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-subtle" />
                <span>
                  {bullet.text}
                  {bullet.citations?.length > 0 && (
                    <span className="ml-1 inline-flex gap-0.5 align-baseline">
                      {bullet.citations.map((citation) => (
                        <Citation
                          key={citation}
                          id={citation}
                          segment={bySentenceId.get(citation) ?? null}
                        />
                      ))}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Citation({ id, segment }: { id: string; segment: TranscriptSeg | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Source ${id}`}
          className={cn(
            "inline-grid h-[14px] min-w-[14px] place-items-center rounded-full border border-border px-1 align-super text-[9px] font-semibold transition-colors",
            open ? "border-accent bg-accent-subtle text-accent" : "text-subtle hover:text-text",
          )}
        >
          {id.replace(/\D/g, "").slice(-2) || "·"}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={6}
          className="z-50 max-w-xs rounded-xl border border-border bg-elevated p-3 text-xs shadow-lg animate-pop-in"
        >
          {segment ? (
            <>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-subtle">
                {segment.speaker === "me" ? "Me" : "Them"}
              </div>
              <p className="leading-relaxed text-text">{segment.text}</p>
            </>
          ) : (
            <p className="text-subtle">Source line not found in this transcript.</p>
          )}
          <Popover.Arrow className="fill-[color:var(--elevated)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
