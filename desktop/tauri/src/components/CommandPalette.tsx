import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Folder,
  Home,
  MessageSquare,
  Mic,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  Users,
} from "lucide-react";
import * as api from "@/lib/api";
import { formatDayLabel } from "@/lib/format";
import { MY_NOTES_SPACE } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { useCreateNote } from "@/hooks/useCreateNote";
import { applyTheme, readStoredPreference, writeStoredPreference } from "@/lib/theme";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, Kbd } from "@/components/ui/misc";
import type { SearchHit, Person } from "@/lib/types";

export function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const navigate = useAppStore((s) => s.navigate);
  const openNote = useAppStore((s) => s.openNote);
  const openActionItems = useAppStore((s) => s.openActionItems);
  const createNote = useCreateNote();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 100);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveFilter(null);
    }
  }, [open]);

  // Handle clicking quick filter chip
  const toggleFilter = (filterKey: string, filterSyntax: string) => {
    if (activeFilter === filterKey) {
      setActiveFilter(null);
      setQuery((prev) => prev.replace(filterSyntax, "").trim());
    } else {
      setActiveFilter(filterKey);
      setQuery((prev) => `${prev.trim()} ${filterSyntax}`.trim());
    }
  };

  const { data: searchResult, isLoading } = useQuery({
    queryKey: api.qk.searchGlobal(debounced),
    queryFn: () => api.searchGlobal(debounced),
    enabled: open && debounced.length > 0,
  });

  const { data: recentMeetings = [] } = useQuery({
    queryKey: api.qk.meetings(),
    queryFn: () => api.listMeetings(),
    enabled: open && debounced.length === 0,
  });

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const hits: SearchHit[] = searchResult?.hits || [];
  const matchedPeople: Person[] = searchResult?.matched_people || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent bare className="max-w-[580px] p-0" aria-label="Command palette">
        <Command
          shouldFilter={false}
          className="overflow-hidden rounded-2xl border border-border bg-elevated shadow-2xl transition-all"
        >
          {/* Top Search Input Bar */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-1">
            <Search className="size-4 shrink-0 text-subtle" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search notes, transcripts, people, or jump to… (e.g. from:@alex has:loop)"
              className="h-11 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-subtle"
            />
            {isLoading && (
              <span className="text-[11px] text-subtle animate-pulse">Searching…</span>
            )}
            <Kbd>ESC</Kbd>
          </div>

          {/* Quick Syntax Filter Chips */}
          <div className="flex items-center gap-1.5 border-b border-border/60 bg-surface/40 px-3 py-1.5 overflow-x-auto text-[11px]">
            <span className="flex items-center gap-1 text-subtle font-medium mr-1">
              <Filter className="size-3" /> Filters:
            </span>
            <button
              type="button"
              onClick={() => toggleFilter("has_loop", "has:loop")}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-colors ${
                query.includes("has:loop")
                  ? "bg-accent text-accent-fg"
                  : "bg-surface border border-border text-subtle hover:bg-hover hover:text-text"
              }`}
            >
              <CheckCircle2 className="size-3" />
              has:loop
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const pastWeek = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
                toggleFilter("recent", `after:${pastWeek}`);
              }}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-colors ${
                query.includes("after:")
                  ? "bg-accent text-accent-fg"
                  : "bg-surface border border-border text-subtle hover:bg-hover hover:text-text"
              }`}
            >
              <Calendar className="size-3" />
              Past 7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                const monthStart = new Date().toISOString().slice(0, 7) + "-01";
                toggleFilter("month", `after:${monthStart}`);
              }}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-colors ${
                query.includes("after:") && activeFilter === "month"
                  ? "bg-accent text-accent-fg"
                  : "bg-surface border border-border text-subtle hover:bg-hover hover:text-text"
              }`}
            >
              <Calendar className="size-3" />
              This Month
            </button>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-1.5 divide-y divide-border/40">
            {debounced.length > 0 && hits.length === 0 && matchedPeople.length === 0 && !isLoading && (
              <Command.Empty className="px-3 py-8 text-center text-[13px] text-subtle">
                No matching notes, transcripts, or people for “{debounced}”
              </Command.Empty>
            )}

            {/* Matched People */}
            {matchedPeople.length > 0 && (
              <Command.Group
                heading="People & Attendees"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
              >
                {matchedPeople.map((person) => (
                  <Item
                    key={person.id}
                    onSelect={() => run(() => navigate({ kind: "people" }))}
                  >
                    <Avatar name={person.name} size={24} className="size-6 text-[10px]" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text text-xs">{person.name}</span>
                        {person.role && (
                          <span className="text-[10px] text-subtle truncate">({person.role})</span>
                        )}
                      </div>
                      <span className="text-[10px] text-subtle truncate">
                        {[person.company_name, person.email].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <span className="text-[10px] text-subtle shrink-0">
                      {person.note_count} {person.note_count === 1 ? "meeting" : "meetings"}
                    </span>
                  </Item>
                ))}
              </Command.Group>
            )}

            {/* FTS Search Results or Recent Notes */}
            {debounced.length > 0 ? (
              hits.length > 0 && (
                <Command.Group
                  heading={`Search Results (${hits.length})`}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
                >
                  {hits.map((hit) => (
                    <Item key={hit.id} onSelect={() => run(() => openNote(hit.id))}>
                      <div className="grid size-7 place-items-center rounded-lg bg-surface border border-border shrink-0 text-subtle">
                        <FileText className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate font-medium text-text text-xs">
                            {hit.title || "Untitled Meeting"}
                          </span>
                          <span className="text-[10px] text-subtle shrink-0">
                            {formatDayLabel(hit.date)}
                          </span>
                        </div>

                        {/* Snippet with highlighted terms */}
                        {hit.snippet ? (
                          renderSnippet(hit.snippet)
                        ) : null}

                        {/* Badges row */}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-subtle">
                          {hit.folder_name && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-surface px-1.5 py-0.2 border border-border">
                              <Folder className="size-2.5" />
                              {hit.folder_name}
                            </span>
                          )}
                          {hit.has_open_loops && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 text-amber-500 px-1.5 py-0.2 border border-amber-500/20 font-medium">
                              <CheckCircle2 className="size-2.5" />
                              Open Loops
                            </span>
                          )}
                          {hit.attendees.length > 0 && (
                            <span className="truncate max-w-[200px]">
                              {hit.attendees.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </Item>
                  ))}
                </Command.Group>
              )
            ) : (
              recentMeetings.length > 0 && (
                <Command.Group
                  heading="Recent Notes"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
                >
                  {recentMeetings.slice(0, 5).map((note) => (
                    <Item key={note.id} onSelect={() => run(() => openNote(note.id))}>
                      <FileText className="size-4 text-subtle shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-xs">{note.title || "Untitled Meeting"}</span>
                      <span className="text-[11px] text-subtle shrink-0">{formatDayLabel(note.date)}</span>
                    </Item>
                  ))}
                </Command.Group>
              )
            )}

            {/* Quick Actions */}
            <Command.Group
              heading="Actions"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
            >
              <Item onSelect={() => run(() => createNote.mutate({}))}>
                <Plus className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">New note</span>
                <Kbd>Ctrl+N</Kbd>
              </Item>
              <Item onSelect={() => run(() => createNote.mutate({ record: true }))}>
                <Mic className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">New note and start recording</span>
                <Kbd>Ctrl+R</Kbd>
              </Item>
              <Item onSelect={() => run(() => openActionItems())}>
                <CheckCircle2 className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">Open Loops & Commitments Inbox</span>
                <Kbd>Ctrl+L</Kbd>
              </Item>
              <Item
                onSelect={() =>
                  run(() => {
                    const current = readStoredPreference();
                    const next = current === "dark" ? "light" : "dark";
                    writeStoredPreference(next);
                    applyTheme(next);
                  })
                }
              >
                <Sun className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">
                  Toggle Dark / Light Theme
                </span>
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "settings", tab: "preferences" }))}>
                <Download className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">Export All Notes (CSV / Backup)</span>
              </Item>
            </Command.Group>

            {/* Go to Navigation */}
            <Command.Group
              heading="Go to"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
            >
              <Item onSelect={() => run(() => navigate({ kind: "home" }))}>
                <Home className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">Home</span>
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "space", spaceId: MY_NOTES_SPACE }))}>
                <FileText className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">My notes</span>
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "chat", sessionId: null }))}>
                <MessageSquare className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">Chat</span>
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "shared" }))}>
                <Users className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">Shared with me</span>
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "people" }))}>
                <User className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">People</span>
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "companies" }))}>
                <Building2 className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">Companies</span>
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "settings", tab: "preferences" }))}>
                <Settings className="size-4 text-subtle shrink-0" />
                <span className="flex-1 text-xs">Settings</span>
              </Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Item({ onSelect, children }: { onSelect: () => void; children: React.ReactNode }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-text outline-none data-[selected=true]:bg-hover transition-colors"
    >
      {children}
    </Command.Item>
  );
}

/**
 * Safely renders snippet strings produced by SQLite FTS5 snippet(),
 * parsing <mark> tags into styled React <mark> elements with zero HTML injection risk.
 */
function renderSnippet(snippet: string) {
  if (!snippet) return null;
  const parts = snippet.split(/(<mark>.*?<\/mark>)/g);
  return (
    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-subtle font-sans">
      {parts.map((part, i) => {
        if (part.startsWith("<mark>") && part.endsWith("</mark>")) {
          const inner = part.slice(6, -7);
          return (
            <mark
              key={i}
              className="rounded bg-accent/20 px-1 py-0.2 text-accent font-semibold not-italic"
            >
              {inner}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
