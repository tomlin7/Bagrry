import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMeeting, dbStatus, listMeetings, listTemplates } from "@/lib/api";
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

  const status = useQuery({ queryKey: ["db-status"], queryFn: dbStatus });
  const meetings = useQuery({ queryKey: ["meetings"], queryFn: listMeetings });
  const templates = useQuery({ queryKey: ["templates"], queryFn: listTemplates });

  const create = useMutation({
    mutationFn: () => createMeeting("Untitled meeting"),
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["db-status"] });
      selectMeeting(meeting.id);
    },
  });

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
            <Plus />
            New
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {meetings.isLoading && (
            <p className="px-2 py-3 text-xs text-muted-foreground">Loading meetings…</p>
          )}
          {meetings.data?.length === 0 && (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              No meetings yet. Create one to start the scratchpad.
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
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div>
            <h1 className="text-base font-semibold">
              {selected?.title ?? "Scratchpad"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {templates.data?.map((t) => t.name).join(" · ") || "Templates seeding…"}
            </p>
          </div>
          <Button variant="outline" disabled>
            <Mic />
            Record
          </Button>
        </header>
        <section className="grid min-h-0 flex-1 grid-cols-2 gap-px bg-border">
          <div className="bg-background p-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              My notes
            </p>
            <p className="text-sm text-muted-foreground">
              Live scratchpad lands here in Phase 3. Storage and the local database are ready.
            </p>
          </div>
          <div className="bg-card p-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Enhanced
            </p>
            <p className="text-sm text-muted-foreground">
              Structured notes with citations will appear after a meeting is transcribed.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
