import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { Page } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

const GO: { page: Page; label: string; hint: string }[] = [
  { page: "dashboard", label: "Go to Home", hint: "Dashboard" },
  { page: "notes", label: "Go to Notes", hint: "Notepad" },
  { page: "search", label: "Ask across meetings", hint: "Chat" },
  { page: "calendar", label: "Calendar & briefs", hint: "Prep" },
  { page: "actions", label: "Action items", hint: "Follow-up" },
  { page: "people", label: "People", hint: "Directory" },
  { page: "companies", label: "Companies", hint: "Accounts" },
  { page: "templates", label: "Templates & recipes", hint: "Enhance" },
  { page: "workspace", label: "Workspace", hint: "Plan & privacy" },
  { page: "settings", label: "Settings", hint: "Keys" },
];

export function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const setPage = useAppStore((s) => s.setPage);
  const selectMeeting = useAppStore((s) => s.selectMeeting);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const [q, setQ] = useState("");
  const meetings = useQuery({
    queryKey: ["meetings", null],
    queryFn: () => api.listMeetings(null),
    enabled: open,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useAppStore.getState().paletteOpen);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const jumps = GO.filter((g) => !query || g.label.toLowerCase().includes(query) || g.hint.toLowerCase().includes(query));
    const notes = (meetings.data ?? []).filter((m) => !query || m.title.toLowerCase().includes(query)).slice(0, 8);
    return { jumps, notes };
  }, [q, meetings.data]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#1c1914]/25 px-4 pt-[12vh] backdrop-blur-[2px]" onClick={() => setOpen(false)}>
      <div
        className="paper-card w-full max-w-xl overflow-hidden rounded-2xl border border-[#e4dfd3]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none"
          placeholder="Jump, search notes, or ask…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {items.jumps.map((g) => (
            <button
              key={g.page}
              type="button"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                setPage(g.page);
                setOpen(false);
              }}
            >
              <span>{g.label}</span>
              <span className="text-[11px] text-muted-foreground">{g.hint}</span>
            </button>
          ))}
          {items.notes.length > 0 && (
            <p className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Notes</p>
          )}
          {items.notes.map((m) => (
            <button
              key={m.id}
              type="button"
              className="flex w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                selectMeeting(m.id);
                setOpen(false);
              }}
            >
              {m.title}
            </button>
          ))}
          {q.trim() && (
            <button
              type="button"
              className={cn("mt-1 flex w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent")}
              onClick={() => {
                setPage("search");
                setChatOpen(true);
                setOpen(false);
              }}
            >
              Ask “{q.trim()}” across meetings
            </button>
          )}
        </div>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Ctrl+K · Esc to close</p>
      </div>
    </div>
  );
}
