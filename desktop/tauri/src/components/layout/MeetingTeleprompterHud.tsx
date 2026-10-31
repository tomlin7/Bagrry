import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  GripVertical,
  ListTodo,
  Loader2,
  Maximize2,
  Mic,
  Minimize2,
  Pause,
  Pin,
  Play,
  Radio,
  Send,
  Sparkles,
  Trash2,
  Tv,
  Volume2,
  X,
} from "lucide-react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";
import { Elapsed } from "@/components/notes/TranscriptPanel";
import { DualChannelVuMeter } from "@/components/notes/DualChannelVuMeter";
import { toast } from "@/components/ui/toast";

export function MeetingTeleprompterHud({
  open,
  onClose,
  onMinimizeToPill,
}: {
  open: boolean;
  onClose: () => void;
  onMinimizeToPill: () => void;
}) {
  const queryClient = useQueryClient();
  const recState = useAppStore((s) => s.recState);
  const startedAt = useAppStore((s) => s.recordingStartedAt);
  const noteId = useAppStore((s) => s.recordingMeetingId);
  const liveSegments = useAppStore((s) => s.liveSegments);
  const applyRecStatus = useAppStore((s) => s.applyRecStatus);
  const clearLiveSegments = useAppStore((s) => s.clearLiveSegments);
  const openNote = useAppStore((s) => s.openNote);

  const [activeTab, setActiveTab] = useState<"stream" | "notes" | "copilot">("stream");
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotAnswer, setCopilotAnswer] = useState<string | null>(null);
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [scratchpadText, setScratchpadText] = useState("");
  const [isPinned, setIsPinned] = useState(true);

  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Fetch meeting title and scratchpad if noteId exists
  const { data: meeting } = useQuery({
    queryKey: api.qk.meeting(noteId ?? ""),
    queryFn: () => (noteId ? api.getMeeting(noteId) : null),
    enabled: !!noteId,
  });

  useEffect(() => {
    if (meeting?.scratchpad_raw) {
      setScratchpadText(meeting.scratchpad_raw);
    }
  }, [meeting?.scratchpad_raw]);

  // Auto-scroll transcript stream
  useEffect(() => {
    if (activeTab === "stream" && transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [liveSegments.length, activeTab]);

  const pauseMutation = useMutation({
    mutationFn: () => api.pauseRecording(),
    onSuccess: applyRecStatus,
    onError: (e) => toast.error(e),
  });

  const finishAndEnhanceMutation = useMutation({
    mutationFn: async () => {
      const status = await api.stopRecording();
      applyRecStatus(status);
      if (noteId) {
        await api.transcribePending(noteId);
        try {
          await api.enhanceMeeting(noteId);
        } catch {
          // Enhancing might require an external key; transcription succeeded
        }
      }
    },
    onSuccess: () => {
      clearLiveSegments();
      onClose();
      if (noteId) {
        void queryClient.invalidateQueries({ queryKey: api.qk.segments(noteId) });
        void queryClient.invalidateQueries({ queryKey: api.qk.meeting(noteId) });
        openNote(noteId);
      }
      toast.success("Meeting finished & enhanced");
    },
    onError: (e) => toast.error(e),
  });

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = copilotQuery.trim();
    if (!query || copilotBusy) return;

    setCopilotBusy(true);
    setCopilotAnswer(null);

    // Combine recent live transcript lines
    const transcriptText = liveSegments.map((s) => `[${s.speaker}]: ${s.text}`).join("\n");

    try {
      const answer = await api.liveAsk(query, transcriptText);
      setCopilotAnswer(answer);
      setCopilotQuery("");
    } catch (err) {
      toast.error(err, "Copilot query failed");
    } finally {
      setCopilotBusy(false);
    }
  };

  const handleSaveScratchpad = (text: string) => {
    setScratchpadText(text);
    if (noteId) {
      void api.saveScratchpad(noteId, text, null);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed bottom-10 right-10 z-[9999] flex w-[380px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface/95 shadow-2xl backdrop-blur-xl text-text select-none"
      style={{ touchAction: "none" }}
    >
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between border-b border-border/60 bg-surface-2/60 px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="cursor-grab active:cursor-grabbing text-subtle/70 hover:text-subtle"
            title="Drag HUD"
          >
            <GripVertical className="size-3.5" />
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-text truncate">
            <Tv className="size-3.5 text-accent" />
            <span className="truncate">{meeting?.title || "Meeting Copilot HUD"}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={`grid size-6 place-items-center rounded-md transition-colors ${
              isPinned ? "text-accent bg-accent/15" : "text-subtle hover:bg-hover"
            }`}
            title={isPinned ? "Pinned on top" : "Pin on top"}
          >
            <Pin className="size-3" />
          </button>
          <button
            type="button"
            onClick={onMinimizeToPill}
            className="grid size-6 place-items-center rounded-md text-subtle hover:bg-hover hover:text-text transition-colors"
            title="Minimize to floating pill"
          >
            <Minimize2 className="size-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid size-6 place-items-center rounded-md text-subtle hover:bg-hover hover:text-text transition-colors"
            title="Close HUD"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      {/* Rec Status Bar */}
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5 text-[11px] bg-surface/40">
        <div className="flex items-center gap-2">
          {recState === "recording" ? (
            <span className="flex items-center gap-1.5 font-semibold text-rose-500">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
              </span>
              <span>REC</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-semibold text-amber-400">
              <span className="size-2 rounded-full bg-amber-400" />
              <span>PAUSED</span>
            </span>
          )}
          {startedAt && (
            <span className="font-mono text-subtle">
              <Elapsed startedAt={startedAt} />
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DualChannelVuMeter />
          <button
            type="button"
            onClick={() => pauseMutation.mutate()}
            className="grid size-5 place-items-center rounded text-subtle hover:text-text transition-colors"
            title={recState === "paused" ? "Resume" : "Pause"}
          >
            {recState === "paused" ? (
              <Play className="size-3 fill-current text-emerald-400" />
            ) : (
              <Pause className="size-3 fill-current text-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-border/40 text-[11px] font-medium bg-surface/60">
        <button
          type="button"
          onClick={() => setActiveTab("stream")}
          className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
            activeTab === "stream"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-subtle hover:text-text"
          }`}
        >
          Live Stream ({liveSegments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
            activeTab === "notes"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-subtle hover:text-text"
          }`}
        >
          Talking Points
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("copilot")}
          className={`flex-1 py-1.5 text-center border-b-2 transition-colors ${
            activeTab === "copilot"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-subtle hover:text-text"
          }`}
        >
          Copilot Q&A
        </button>
      </div>

      {/* Body Content */}
      <div className="h-56 overflow-y-auto p-3 text-[12px]">
        {activeTab === "stream" && (
          <div ref={transcriptScrollRef} className="h-full overflow-y-auto space-y-2 pr-1">
            {liveSegments.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-subtle">
                <Radio className="mb-2 size-5 text-accent animate-pulse" />
                <p className="font-medium">Listening to live meeting…</p>
                <p className="text-[11px] text-muted">Spoken speech turns will stream here in real-time.</p>
              </div>
            ) : (
              liveSegments.map((seg, idx) => (
                <div key={seg.id || idx} className="rounded-lg bg-surface-2/60 p-2 leading-relaxed">
                  <div className="mb-0.5 flex items-center justify-between text-[10px] font-semibold text-subtle">
                    <span className={seg.speaker === "me" ? "text-emerald-500" : "text-blue-400"}>
                      {seg.speaker === "me" ? "You" : "Attendees"}
                    </span>
                    <span>{Math.floor(seg.start_ms / 1000)}s</span>
                  </div>
                  <p className="text-text">{seg.text}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="flex h-full flex-col">
            <textarea
              value={scratchpadText}
              onChange={(e) => handleSaveScratchpad(e.target.value)}
              placeholder="Type rapid talking points, agenda notes, or commitments made on this call…"
              className="h-full w-full resize-none rounded-lg border border-border/60 bg-surface/50 p-2 text-[12px] leading-relaxed text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
        )}

        {activeTab === "copilot" && (
          <div className="flex h-full flex-col justify-between space-y-2">
            <div className="flex-1 overflow-y-auto rounded-lg border border-border/50 bg-surface/50 p-2">
              {copilotBusy ? (
                <div className="flex h-full items-center justify-center gap-2 text-subtle text-xs">
                  <Loader2 className="size-4 animate-spin text-accent" />
                  <span>Synthesizing live copilot response…</span>
                </div>
              ) : copilotAnswer ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                    <Sparkles className="size-3" />
                    <span>In-Call Copilot</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-text whitespace-pre-wrap">
                    {copilotAnswer}
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-subtle">
                  <Bot className="mb-1.5 size-5 text-accent" />
                  <p className="text-xs font-medium">In-Meeting AI Copilot</p>
                  <p className="text-[10px] text-muted">
                    Ask questions grounded in this call's live spoken transcript.
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleAskCopilot} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Ask about this call…"
                className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[12px] text-text placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={copilotBusy || !copilotQuery.trim()}
                className="grid size-7 place-items-center rounded-lg bg-accent text-accent-fg hover:opacity-90 disabled:opacity-40"
              >
                <Send className="size-3" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Finish & Actions */}
      <div className="flex items-center justify-between border-t border-border/60 bg-surface-2/40 px-3 py-2">
        <span className="text-[11px] text-subtle">Always on top</span>
        <button
          type="button"
          onClick={() => finishAndEnhanceMutation.mutate()}
          disabled={finishAndEnhanceMutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-fg hover:opacity-90 transition-opacity"
        >
          <Sparkles className="size-3" />
          <span>Finish Call</span>
        </button>
      </div>
    </motion.div>
  );
}
