import { useMemo, useState } from "react";
import type { EnhancedDoc, TranscriptSeg } from "@/lib/types";

export function EnhancedNotes({
  json,
  segments,
}: {
  json: string | null;
  segments: TranscriptSeg[];
}) {
  const doc = useMemo(() => parseDoc(json), [json]);
  const [open, setOpen] = useState<string[] | null>(null);

  if (!doc) {
    return (
      <p className="text-sm text-muted-foreground">
        Enhanced notes appear after you run Enhance. They stay anchored to your scratchpad with
        sentence citations.
      </p>
    );
  }

  return (
    <div className="relative h-full min-w-0 overflow-x-hidden overflow-y-auto pr-2 break-words">
      {doc.sections.map((section) => (
        <div key={section.section_title} className="mb-5">
          <h3 className="mb-2 text-sm font-semibold">{section.section_title}</h3>
          <ul className="space-y-2">
            {section.bullet_points.map((bp, i) => (
              <li key={i} className="group text-sm leading-relaxed">
                <span>{bp.text}</span>
                {bp.citations.length > 0 && (
                  <button
                    type="button"
                    className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] opacity-40 group-hover:opacity-100"
                    title="Zoom in on transcript"
                    onClick={() => setOpen(bp.citations)}
                  >
                    +
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {open && (
        <aside className="absolute right-0 top-0 w-80 rounded-lg border border-border bg-popover p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide">Transcript</p>
            <button className="text-xs text-muted-foreground" onClick={() => setOpen(null)}>
              Close
            </button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {open.map((cid) => {
              const seg = segments.find((s) => s.sentence_id === cid);
              return (
                <p key={cid} className="rounded bg-muted px-2 py-1 text-xs">
                  <span className="font-medium">{cid}</span>{" "}
                  <span className="text-muted-foreground">{seg?.speaker}</span>
                  <br />
                  {seg?.text ?? "Missing sentence"}
                </p>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}

function parseDoc(json: string | null): EnhancedDoc | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    if (v.sections) return v as EnhancedDoc;
  } catch {
    return null;
  }
  return null;
}
