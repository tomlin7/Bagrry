import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Languages, Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
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
import { VuMeter } from "./VuMeter";
import { Elapsed } from "./TranscriptPanel";

/**
 * Transport for the recorder. Stopping also kicks off transcription, which is
 * a network round-trip, so the button stays in a loading state until it lands.
 */
export function RecordingControls({ noteId, compact }: { noteId: string; compact?: boolean }) {
  const queryClient = useQueryClient();
  const recState = useAppStore((s) => s.recState);
  const startedAt = useAppStore((s) => s.recordingStartedAt);
  const applyRecStatus = useAppStore((s) => s.applyRecStatus);
  const loopbackOk = useAppStore((s) => s.loopbackOk);

  const start = useMutation({
    mutationFn: () => api.startRecording(noteId),
    onSuccess: applyRecStatus,
    onError: (e) => toast.error(e, "Check your microphone permissions."),
  });

  const pause = useMutation({
    mutationFn: () => api.pauseRecording(),
    onSuccess: applyRecStatus,
    onError: (e) => toast.error(e),
  });

  const stop = useMutation({
    mutationFn: async () => {
      const status = await api.stopRecording();
      applyRecStatus(status);
      // Transcription needs a Groq key; surface that as guidance, not a crash.
      await api.transcribePending(noteId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.segments(noteId) });
      void queryClient.invalidateQueries({ queryKey: api.qk.meeting(noteId) });
      toast.success("Recording transcribed");
    },
    onError: (e) => toast.error(e, "The audio is still in memory — you can retry."),
  });

  const discard = useMutation({
    mutationFn: () => api.discardAudio(),
    onSuccess: (status) => {
      applyRecStatus(status);
      toast.success("Audio discarded");
    },
    onError: (e) => toast.error(e),
  });

  const idle = recState === "idle";

  return (
    <div className="flex items-center gap-2">
      {idle ? (
        <Tooltip label="Start recording" shortcut="Ctrl+Shift+R">
          <button
            type="button"
            aria-label="Start recording"
            onClick={() => start.mutate()}
            disabled={start.isPending}
            className="grid size-8 place-items-center rounded-full bg-danger text-danger-fg transition-transform hover:scale-105 disabled:opacity-60"
          >
            <Mic className="size-4" />
          </button>
        </Tooltip>
      ) : (
        <>
          <VuMeter />
          <Tooltip label={recState === "paused" ? "Resume" : "Pause"} shortcut="Ctrl+Shift+P">
            <button
              type="button"
              aria-label={recState === "paused" ? "Resume recording" : "Pause recording"}
              onClick={() => pause.mutate()}
              className="grid size-6 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-text"
            >
              {recState === "paused" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
          </Tooltip>
          <Tooltip label="Stop and transcribe">
            <button
              type="button"
              aria-label="Stop recording"
              onClick={() => stop.mutate()}
              disabled={stop.isPending}
              className="grid size-6 place-items-center rounded-md text-text transition-colors hover:bg-hover disabled:opacity-60"
            >
              <Square className="size-3 fill-current" />
            </button>
          </Tooltip>
          {startedAt && (
            <span className="tabular text-[11px] text-muted">
              <Elapsed startedAt={startedAt} />
            </span>
          )}
        </>
      )}

      {!compact && (
        <>
          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-muted transition-colors hover:bg-hover hover:text-text"
              >
                <Mic className="size-3.5" />
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Audio sources</DropdownMenuLabel>
              <DropdownMenuItem disabled>
                <Mic />
                Microphone
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span className={cn("size-2 rounded-full", loopbackOk ? "bg-success" : "bg-subtle")} />
                System audio {loopbackOk ? "ready" : "unavailable"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive disabled={idle} onSelect={() => discard.mutate()}>
                <Trash2 />
                Discard captured audio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-muted transition-colors hover:bg-hover hover:text-text"
          >
            <Languages className="size-3.5" />
            English
            <ChevronDown className="size-3" />
          </button>
        </>
      )}
    </div>
  );
}
