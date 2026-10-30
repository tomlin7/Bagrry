import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
} from "lucide-react";
import { useAudioPlayerStore, PLAYBACK_RATES } from "@/store/audio";
import { useAppStore } from "@/store/app";
import { formatElapsed } from "@/lib/format";
import type { TranscriptSeg } from "@/lib/types";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AudioPlayerBarProps {
  meetingId: string;
  segments?: TranscriptSeg[];
}

export function AudioPlayerBar({ meetingId, segments = [] }: AudioPlayerBarProps) {
  const isPlaying = useAudioPlayerStore((s) => s.isPlaying);
  const currentTimeMs = useAudioPlayerStore((s) => s.currentTimeMs);
  const durationMs = useAudioPlayerStore((s) => s.durationMs);
  const playbackRate = useAudioPlayerStore((s) => s.playbackRate);
  const activeMeetingId = useAudioPlayerStore((s) => s.activeMeetingId);
  const isMuted = useAudioPlayerStore((s) => s.isMuted);
  const isVisible = useAudioPlayerStore((s) => s.isVisible);

  const togglePlay = useAudioPlayerStore((s) => s.togglePlay);
  const seek = useAudioPlayerStore((s) => s.seek);
  const skip = useAudioPlayerStore((s) => s.skip);
  const setPlaybackRate = useAudioPlayerStore((s) => s.setPlaybackRate);
  const toggleMute = useAudioPlayerStore((s) => s.toggleMute);
  const close = useAudioPlayerStore((s) => s.close);

  const setHighlightSentenceId = useAppStore((s) => s.setHighlightSentenceId);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [hoverTimeMs, setHoverTimeMs] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);

  // If player is open for another meeting or not visible, hide
  if (!isVisible || (activeMeetingId && activeMeetingId !== meetingId)) {
    return null;
  }

  // Find segment currently being played
  const currentSegment = useMemo(() => {
    return segments.find((s) => currentTimeMs >= s.start_ms && currentTimeMs <= s.end_ms);
  }, [segments, currentTimeMs]);

  // Generate 48 waveform bar heights based on segments distribution
  const waveformBars = useMemo(() => {
    const barsCount = 48;
    const heights = new Array(barsCount).fill(12);
    if (durationMs <= 0) return heights;

    const bucketMs = durationMs / barsCount;
    for (let i = 0; i < barsCount; i++) {
      const bucketStart = i * bucketMs;
      const bucketEnd = (i + 1) * bucketMs;
      const inBucket = segments.some(
        (s) => Math.max(bucketStart, s.start_ms) < Math.min(bucketEnd, s.end_ms),
      );
      // Pseudo-random speech amplitude modulation
      const pseudoRandom = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const noise = Math.abs(pseudoRandom - Math.floor(pseudoRandom));
      heights[i] = inBucket ? Math.floor(14 + noise * 20) : Math.floor(6 + noise * 6);
    }
    return heights;
  }, [segments, durationMs]);

  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, (currentTimeMs / durationMs) * 100)) : 0;

  const handleSeekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || durationMs <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * durationMs);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || durationMs <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTimeMs(ratio * durationMs);
    setHoverX(e.clientX - rect.left);
  };

  const handleMouseLeave = () => {
    setHoverTimeMs(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="pointer-events-auto mx-auto w-full max-w-[800px] select-none"
      >
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-2/95 p-3.5 shadow-2xl backdrop-blur-xl">
          {/* Top row: quote preview (if speaking) + jump to transcript */}
          {currentSegment && (
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 text-[12px]">
              <div className="flex items-center gap-2 overflow-hidden truncate">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    currentSegment.speaker === "me"
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-3 text-subtle",
                  )}
                >
                  {currentSegment.speaker === "me" ? "Me" : "Them"}
                </span>
                <span className="truncate italic text-muted">
                  &ldquo;{currentSegment.text}&rdquo;
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHighlightSentenceId(currentSegment.sentence_id)}
                className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-accent transition-colors hover:bg-accent/10 cursor-pointer"
              >
                <span>Transcript</span>
                <ExternalLink className="size-3" />
              </button>
            </div>
          )}

          {/* Center row: Waveform scrubber */}
          <div
            ref={progressBarRef}
            onClick={handleSeekFromEvent}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative flex h-10 w-full cursor-pointer items-end gap-[3px] rounded-lg px-2 hover:bg-hover/30"
          >
            {/* Waveform Bars */}
            {waveformBars.map((height, idx) => {
              const barPercent = (idx / waveformBars.length) * 100;
              const isPast = barPercent <= progressPercent;
              return (
                <div
                  key={idx}
                  style={{ height: `${height}px` }}
                  className={cn(
                    "flex-1 rounded-full transition-all duration-150",
                    isPast
                      ? "bg-accent group-hover:bg-accent"
                      : "bg-border-strong group-hover:bg-subtle/50",
                  )}
                />
              );
            })}

            {/* Playhead Indicator */}
            <div
              style={{ left: `${progressPercent}%` }}
              className="pointer-events-none absolute top-1 bottom-1 w-[2px] -translate-x-1/2 rounded-full bg-accent shadow-sm"
            >
              <div className="size-2 -translate-x-[3px] rounded-full bg-accent ring-2 ring-surface-2" />
            </div>

            {/* Hover Tooltip Timestamp */}
            {hoverTimeMs !== null && (
              <div
                style={{ left: `${hoverX}px` }}
                className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md border border-border bg-elevated px-1.5 py-0.5 text-[10px] font-mono font-medium text-text shadow-md"
              >
                {formatElapsed(hoverTimeMs)}
              </div>
            )}
          </div>

          {/* Bottom row: Controls & Timers */}
          <div className="flex items-center justify-between pt-1">
            {/* Left: Time clocks */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
              <span className="font-semibold text-text">{formatElapsed(currentTimeMs)}</span>
              <span className="text-subtle">/</span>
              <span>{formatElapsed(durationMs)}</span>
            </div>

            {/* Center: Play/Pause, Skip Back, Skip Forward */}
            <div className="flex items-center gap-1">
              <Tooltip label="Skip back 5s (J)">
                <button
                  type="button"
                  aria-label="Skip back 5 seconds"
                  onClick={() => skip(-5000)}
                  className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-text cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </Tooltip>

              <button
                type="button"
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                onClick={togglePlay}
                className="grid size-8 place-items-center rounded-full bg-accent text-white shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="ml-0.5 size-4 fill-current" />
                )}
              </button>

              <Tooltip label="Skip forward 5s (L)">
                <button
                  type="button"
                  aria-label="Skip forward 5 seconds"
                  onClick={() => skip(5000)}
                  className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-text cursor-pointer"
                >
                  <RotateCw className="size-3.5" />
                </button>
              </Tooltip>
            </div>

            {/* Right: Speed Pills, Mute, Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full border border-border bg-hover/40 p-0.5">
                {PLAYBACK_RATES.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPlaybackRate(rate)}
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer",
                      playbackRate === rate
                        ? "bg-surface-2 text-accent shadow-xs"
                        : "text-subtle hover:text-text",
                    )}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <Tooltip label={isMuted ? "Unmute" : "Mute"}>
                <button
                  type="button"
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  onClick={toggleMute}
                  className="grid size-6 place-items-center rounded-full text-subtle transition-colors hover:bg-hover hover:text-text cursor-pointer"
                >
                  {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                </button>
              </Tooltip>

              <Tooltip label="Close audio player">
                <button
                  type="button"
                  aria-label="Close audio player"
                  onClick={close}
                  className="grid size-6 place-items-center rounded-full text-subtle transition-colors hover:bg-hover hover:text-text cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
