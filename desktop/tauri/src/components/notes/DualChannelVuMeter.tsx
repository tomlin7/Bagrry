import { Mic, Volume2 } from "lucide-react";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

const SEGMENT_COUNT = 5;

export function DualChannelVuMeter({ className }: { className?: string }) {
  const vu = useAppStore((s) => s.vu);
  const recState = useAppStore((s) => s.recState);

  // Normalize levels [0, 1] with slight sensitivity boost
  const micNorm = recState === "recording" ? Math.min(1, vu.mic * 3.2) : 0;
  const sysNorm = recState === "recording" ? Math.min(1, vu.system * 3.2) : 0;

  const micLit = Math.round(micNorm * SEGMENT_COUNT);
  const sysLit = Math.round(sysNorm * SEGMENT_COUNT);

  return (
    <div
      className={cn("flex items-center gap-3 px-1 py-0.5 select-none", className)}
      title={`Live Audio: Mic ${(vu.mic * 100).toFixed(0)}%, System ${(vu.system * 100).toFixed(0)}%`}
      aria-label="Dual-channel audio visualizer"
    >
      {/* Microphone Channel */}
      <div className="flex items-center gap-1.5" title="Host Microphone Level">
        <Mic className="size-3 text-emerald-400 shrink-0" />
        <div className="flex items-center gap-0.5">
          {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
            const isLit = i < micLit;
            const isPeak = i === SEGMENT_COUNT - 1;
            return (
              <span
                key={`mic-${i}`}
                className={cn(
                  "h-2.5 w-1 rounded-sm transition-all duration-75",
                  isLit
                    ? isPeak
                      ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                      : "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]"
                    : "bg-border/60",
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-3 w-px bg-border/80" />

      {/* System / Remote Attendee Loopback Channel */}
      <div className="flex items-center gap-1.5" title="Remote Participants Audio Level">
        <Volume2 className="size-3 text-cyan-400 shrink-0" />
        <div className="flex items-center gap-0.5">
          {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
            const isLit = i < sysLit;
            const isPeak = i === SEGMENT_COUNT - 1;
            return (
              <span
                key={`sys-${i}`}
                className={cn(
                  "h-2.5 w-1 rounded-sm transition-all duration-75",
                  isLit
                    ? isPeak
                      ? "bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]"
                      : "bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.4)]"
                    : "bg-border/60",
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
