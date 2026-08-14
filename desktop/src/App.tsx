import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import { Mic, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VuMeter } from "@/components/VuMeter";
import {
  createMeeting,
  dbStatus,
  discardAudio,
  listMeetings,
  listTemplates,
  pauseRecording,
  recordingStatus,
  startRecording,
  stopRecording,
} from "@/lib/api";
import type { RecStatus, VuLevels } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

function formatMeetingDate(value: string) {
  const parsed = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function App() {
  const queryClient = useQueryClient();
  const selectedMeetingId = useAppStore((s) => s.selectedMeetingId);
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  const recState = useAppStore((s) => s.recState);
  const pendingBytes = useAppStore((s) => s.pendingBytes);
  const loopbackOk = useAppStore((s) => s.loopbackOk);
  const vu = useAppStore((s) => s.vu);
  const applyRecStatus = useAppStore((s) => s.applyRecStatus);
  const setVu = useAppStore((s) => s.setVu);

  const status = useQuery({ queryKey: ["db-status"], queryFn: dbStatus });
  const meetings = useQuery({ queryKey: ["meetings"], queryFn: listMeetings });
  const templates = useQuery({ queryKey: ["templates"], queryFn: listTemplates });

  useEffect(() => {
    recordingStatus().then(applyRecStatus).catch(() => undefined);
    let unlistenState: (() => void) | undefined;
    let unlistenVu: (() => void) | undefined;
    listen<RecStatus>("recording-state", (event) => applyRecStatus(event.payload)).then(
      (fn) => {
        unlistenState = fn;
      },
    );
    listen<VuLevels>("audio-vu", (event) => setVu(event.payload)).then((fn) => {
      unlistenVu = fn;
    });
    return () => {
      unlistenState?.();
      unlistenVu?.();
    };
  }, [applyRecStatus, setVu]);

  const create = useMutation({
    mutationFn: () => createMeeting("Untitled meeting"),
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["db-status"] });
      selectMeeting(meeting.id);
    },
  });

  const live = recState === "recording" || recState === "paused";

  async function onRecord() {
    try {
      if (!live && !selectedMeetingId) {
        await create.mutateAsync();
      }
      const next = live ? await stopRecording() : await startRecording();
      applyRecStatus(next);
    } catch (e) {
      console.error(e);
    }
  }

  async function onPause() {
    try {
      applyRecStatus(await pauseRecording());
    } catch (e) {
      console.error(e);
    }
  }

  const selected = meetings.data?.find((m) => m.id === selectedMeetingId);

  return (
    <div className="flex h-full min-h-0 bg-background text-foreground">
      <aside className="flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">Bagrry</p>
            <p className="text-xs text-muted-foreground">Local notes</p>
          </div>
          <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
            New
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {meetings.isLoading && (
            <p className="px-2 py-3 text-xs text-muted-foreground">Loading meetings…</p>
          )}
          {meetings.data?.length === 0 && (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              No meetings yet. Create one or hit Record.
            </p>
          )}
          <ul className="space-y-0.5">
            {meetings.data?.map((meeting) => (
              <li key={meeting.id}>
                <button
                  type="button"
                  onClick={() => selectMeeting(meeting.id)}
                  className={cn(
                    "w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                    selectedMeetingId === meeting.id && "bg-accent",
                  )}
                >
                  <span className="block truncate font-medium">{meeting.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatMeetingDate(meeting.date)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-sidebar-border px-4 py-2 text-[11px] text-muted-foreground">
          SQLite {status.data?.sqlite_version ?? "…"} · {status.data?.meeting_count ?? 0} meetings
          {status.data?.vec_enabled ? " · vec" : ""}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
          <div>
            <h1 className="text-base font-semibold">{selected?.title ?? "Scratchpad"}</h1>
            <p className="text-xs text-muted-foreground">
              Win+Shift+R or Ctrl+Shift+R record · Win+Shift+P or Ctrl+Shift+P pause
              {loopbackOk ? " · system audio on" : live ? " · mic only" : ""}
              {pendingBytes > 0 ? ` · ${(pendingBytes / 1024).toFixed(0)} KB in RAM` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VuMeter mic={vu.mic} system={vu.system} />
            {live && (
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause />
                {recState === "paused" ? "Resume" : "Pause"}
              </Button>
            )}
            <Button variant={live ? "destructive" : "default"} onClick={onRecord}>
              {live ? <Square /> : <Mic />}
              {live ? "Stop" : "Record"}
            </Button>
            {pendingBytes > 0 && recState === "idle" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => applyRecStatus(await discardAudio())}
              >
                Discard audio
              </Button>
            )}
          </div>
        </header>
        <section className="grid min-h-0 flex-1 grid-cols-2 gap-px bg-border">
          <div className="bg-background p-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              My notes
            </p>
            <p className="text-sm text-muted-foreground">
              Audio stays in RAM as 16 kHz dual-mono WAV until transcription (Phase 2). Nothing is
              written to disk.
            </p>
          </div>
          <div className="bg-card p-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Enhanced
            </p>
            <p className="text-sm text-muted-foreground">
              {templates.data?.map((t) => t.name).join(" · ") || "Templates seeding…"}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
