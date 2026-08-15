import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

const BARS = 3;

/** Three dots that light up with the louder of the mic / system levels. */
export function VuMeter({ className }: { className?: string }) {
  const vu = useAppStore((s) => s.vu);
  const recState = useAppStore((s) => s.recState);

  const level = Math.min(1, Math.max(vu.mic, vu.system) * 2.5);
  const lit = recState === "recording" ? Math.round(level * BARS) : 0;

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-hidden>
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors duration-100",
            i < lit ? "bg-accent" : "bg-border-strong",
          )}
        />
      ))}
    </div>
  );
}
