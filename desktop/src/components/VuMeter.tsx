import { cn } from "@/lib/utils";

export function VuMeter({
  mic,
  system,
}: {
  mic: number;
  system: number;
}) {
  return (
    <div className="flex items-end gap-3" title="Mic / system levels">
      <Level label="Mic" value={mic} />
      <Level label="Sys" value={system} />
    </div>
  );
}

function Level({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round(value * 100));
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-8 w-2 overflow-hidden rounded-sm bg-muted">
        <div
          className={cn(
            "mt-auto w-full rounded-sm",
            pct > 80 ? "bg-destructive" : "bg-primary",
          )}
          style={{ height: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
