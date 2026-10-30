import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Loader2,
  Minimize2,
  Maximize2,
  Pause,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";
import { Elapsed } from "@/components/notes/TranscriptPanel";
import { DualChannelVuMeter } from "@/components/notes/DualChannelVuMeter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

export function FloatingRecordingPill() {
  const queryClient = useQueryClient();
  const recState = useAppStore((s) => s.recState);
  const startedAt = useAppStore((s) => s.recordingStartedAt);
  const noteId = useAppStore((s) => s.recordingMeetingId);
  const applyRecStatus = useAppStore((s) => s.applyRecStatus);
  const clearLiveSegments = useAppStore((s) => s.clearLiveSegments);
  const openNote = useAppStore((s) => s.openNote);

  const [minimized, setMinimized] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  const { data: enabled = "1" } = useQuery({
    queryKey: api.qk.settings(["live_indicator"]),
    queryFn: async () => (await api.getSetting("live_indicator")) || "1",
    staleTime: 5_000,
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.pauseRecording(),
    onSuccess: applyRecStatus,
    onError: (e) => toast.error(e),
  });

  const finishAndEnhanceMutation = useMutation({
    mutationFn: async () => {
      setIsTranscribing(true);
      const status = await api.stopRecording();
      applyRecStatus(status);
      if (noteId) {
        await api.transcribePending(noteId);
        try {
          await api.enhanceMeeting(noteId);
        } catch {
          // Enhancing might require an LLM API key; transcription succeeded
        }
      }
    },
    onSuccess: () => {
      setIsTranscribing(false);
      clearLiveSegments();
      if (noteId) {
        void queryClient.invalidateQueries({ queryKey: api.qk.segments(noteId) });
        void queryClient.invalidateQueries({ queryKey: api.qk.meeting(noteId) });
        openNote(noteId);
      }
      toast.success("Meeting recording finished & enhanced!");
    },
    onError: (e) => {
      setIsTranscribing(false);
      toast.error(e, "Audio is saved locally. You can transcribe from the note.");
    },
  });

  const discardMutation = useMutation({
    mutationFn: async () => {
      await api.stopRecording();
      const status = await api.discardAudio();
      applyRecStatus(status);
    },
    onSuccess: () => {
      clearLiveSegments();
      setDiscardModalOpen(false);
      toast.success("Recording discarded");
    },
    onError: (e) => {
      setDiscardModalOpen(false);
      toast.error(e);
    },
  });

  const visible = enabled === "1" && (recState !== "idle" || isTranscribing);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={pillRef}
            drag
            dragMomentum={false}
            dragElastic={0.08}
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center select-none"
            style={{ touchAction: "none" }}
          >
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface/95 px-3 py-1.5 shadow-2xl backdrop-blur-md text-text">
              {/* Drag Handle */}
              <div
                className="cursor-grab active:cursor-grabbing text-subtle/60 hover:text-subtle transition-colors pr-0.5"
                title="Drag pill anywhere"
              >
                <GripVertical className="size-3.5" />
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                {isTranscribing ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                    <Loader2 className="size-3 animate-spin" />
                    <span>TRANSCRIBING</span>
                  </span>
                ) : recState === "recording" ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                    </span>
                    <span>REC</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span>PAUSED</span>
                  </span>
                )}
              </div>

              {/* Elapsed Timer */}
              {startedAt && (
                <span className="font-mono text-xs text-subtle tabular-nums px-1">
                  <Elapsed startedAt={startedAt} />
                </span>
              )}

              {/* Dual Channel VU Meter (shown when not minimized) */}
              {!minimized && !isTranscribing && (
                <>
                  <div className="h-3 w-px bg-border/80" />
                  <DualChannelVuMeter />
                </>
              )}

              {/* Action Buttons */}
              {!isTranscribing && (
                <div className="flex items-center gap-1 pl-1">
                  {/* Pause / Resume */}
                  <button
                    type="button"
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isPending}
                    className="grid size-7 place-items-center rounded-full text-subtle hover:text-text hover:bg-hover transition-colors"
                    title={recState === "paused" ? "Resume recording (Ctrl+Shift+P)" : "Pause recording (Ctrl+Shift+P)"}
                  >
                    {recState === "paused" ? (
                      <Play className="size-3.5 fill-current text-emerald-400" />
                    ) : (
                      <Pause className="size-3.5 fill-current text-amber-400" />
                    )}
                  </button>

                  {/* Finish & Enhance */}
                  <button
                    type="button"
                    onClick={() => finishAndEnhanceMutation.mutate()}
                    disabled={finishAndEnhanceMutation.isPending}
                    className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50"
                    title="Finish and enhance meeting notes with AI synthesis"
                  >
                    <Sparkles className="size-3" />
                    <span>Finish</span>
                  </button>

                  {/* Discard / Cancel */}
                  <button
                    type="button"
                    onClick={() => setDiscardModalOpen(true)}
                    className="grid size-7 place-items-center rounded-full text-subtle hover:text-rose-400 hover:bg-hover transition-colors"
                    title="Discard meeting recording"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}

              {/* Minimize / Maximize Toggle */}
              <button
                type="button"
                onClick={() => setMinimized(!minimized)}
                className="grid size-5 place-items-center text-subtle/50 hover:text-subtle transition-colors ml-0.5"
                title={minimized ? "Expand VU meters" : "Compact pill"}
              >
                {minimized ? <Maximize2 className="size-2.5" /> : <Minimize2 className="size-2.5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discard Confirmation Dialog */}
      <Dialog open={discardModalOpen} onOpenChange={setDiscardModalOpen}>
        <DialogContent className="max-w-sm p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500 text-sm font-semibold">
              <Trash2 className="size-4" />
              Discard Recording Session?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-subtle py-2">
            Are you sure you want to discard this recording? All live audio capture will be terminated immediately
            and cannot be recovered.
          </p>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDiscardModalOpen(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-hover transition-colors"
            >
              Keep Recording
            </button>
            <button
              type="button"
              disabled={discardMutation.isPending}
              onClick={() => discardMutation.mutate()}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
            >
              {discardMutation.isPending ? "Discarding..." : "Discard Audio"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
