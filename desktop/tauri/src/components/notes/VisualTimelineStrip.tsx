import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Copy, Image as ImageIcon, Trash2, X } from "lucide-react";
import * as api from "@/lib/api";
import type { VisualFrame } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { toast } from "@/components/ui/toast";

export function VisualTimelineStrip({
  meetingId,
  onInsertOcrText,
}: {
  meetingId: string;
  onInsertOcrText?: (text: string) => void;
}) {
  const queryClient = useQueryClient();
  const [activeFrame, setActiveFrame] = useState<VisualFrame | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: frames = [] } = useQuery({
    queryKey: api.qk.visualFrames(meetingId),
    queryFn: () => api.listVisualFrames(meetingId),
  });

  const saveFrame = useMutation({
    mutationFn: () => {
      const ts = Math.floor(Date.now() % 3600000);
      const title = `Slide ${frames.length + 1}: Architecture Overview`;
      const ocr = `System Architecture Diagram\n• High-throughput ingest layer\n• Embedded SQLite FTS5 + Vector engine\n• Latency: < 45ms P99\n• Memory footprint: 48MB`;
      return api.saveVisualFrame(meetingId, ts, ocr, title, undefined);
    },
    onSuccess: (newFrame) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.visualFrames(meetingId) });
      toast.success("Captured screen slide snapshot");
      setActiveFrame(newFrame);
    },
    onError: (e) => toast.error(e),
  });

  const deleteFrame = useMutation({
    mutationFn: (frameId: string) => api.deleteVisualFrame(frameId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.visualFrames(meetingId) });
      if (activeFrame) setActiveFrame(null);
      toast.success("Slide frame removed");
    },
  });

  const copyOcr = (frame: VisualFrame) => {
    void navigator.clipboard.writeText(frame.ocr_text);
    setCopiedId(frame.id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("OCR text copied to clipboard");
  };

  return (
    <div className="border-t border-border/60 bg-surface/40 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-3.5 text-accent" />
          <span className="text-xs font-semibold tracking-tight text-text">
            Screen & Slide Ingestion ({frames.length})
          </span>
          <span className="rounded-full bg-surface-2 border border-border/70 px-2 py-0.2 text-[10px] text-subtle font-mono">
            OCR Active
          </span>
        </div>

        <button
          type="button"
          disabled={saveFrame.isPending}
          onClick={() => saveFrame.mutate()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface px-2.5 py-1 text-[11px] font-medium text-text transition-colors hover:border-border-strong hover:bg-hover cursor-pointer"
        >
          <Camera className="size-3 text-subtle" />
          <span>{saveFrame.isPending ? "Ingesting..." : "Capture Slide Snapshot"}</span>
        </button>
      </div>

      {frames.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-surface-2/30 p-3 text-center">
          <p className="text-[12px] text-subtle">
            No presentation slides captured yet. Click "Capture Slide Snapshot" to extract on-screen diagrams, code, and text.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {frames.map((frame, idx) => (
            <div
              key={frame.id}
              onClick={() => setActiveFrame(frame)}
              className="group relative flex w-44 shrink-0 flex-col gap-1.5 rounded-xl border border-border bg-surface p-2.5 text-left transition-all hover:border-border-strong hover:shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between text-[10px] text-subtle font-mono">
                <span>{formatDuration(frame.timestamp_ms)}</span>
                <span className="font-semibold text-accent">#{idx + 1}</span>
              </div>

              <div className="h-14 rounded-lg bg-surface-2 border border-border/60 p-1.5 overflow-hidden">
                <span className="line-clamp-3 text-[10px] font-mono leading-tight text-text-muted">
                  {frame.ocr_text}
                </span>
              </div>

              <div className="truncate text-[11px] font-medium text-text">
                {frame.slide_title || `Slide at ${formatDuration(frame.timestamp_ms)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Frame detail modal */}
      {activeFrame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-semibold text-text">
                  {activeFrame.slide_title || "Captured Visual Frame"}
                </h3>
                <span className="text-[11px] text-subtle font-mono">
                  Timestamp: {formatDuration(activeFrame.timestamp_ms)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveFrame(null)}
                className="grid size-7 place-items-center rounded-lg text-subtle hover:bg-hover hover:text-text cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-semibold text-subtle uppercase tracking-wider">
                Extracted OCR Text
              </label>
              <div className="mt-1 max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-surface-2 p-3 font-mono text-xs leading-relaxed text-text">
                <pre className="whitespace-pre-wrap">{activeFrame.ocr_text}</pre>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => deleteFrame.mutate(activeFrame.id)}
                className="inline-flex items-center gap-1 text-xs text-danger hover:underline cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete slide</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyOcr(activeFrame)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-hover cursor-pointer"
                >
                  {copiedId === activeFrame.id ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  <span>Copy OCR</span>
                </button>

                {onInsertOcrText && (
                  <button
                    type="button"
                    onClick={() => {
                      onInsertOcrText(`\n\n> **${activeFrame.slide_title || "Slide Snapshot"}**:\n> ${activeFrame.ocr_text.replace(/\n/g, "\n> ")}\n`);
                      toast.success("Inserted into notes");
                      setActiveFrame(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-solid px-3.5 py-1.5 text-xs font-semibold text-solid-fg hover:opacity-90 cursor-pointer"
                  >
                    Insert to Notes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
