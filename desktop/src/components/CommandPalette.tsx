import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import {
  FileText,
  Home,
  MessageSquare,
  Mic,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import * as api from "@/lib/api";
import { formatDayLabel } from "@/lib/format";
import { MY_NOTES_SPACE } from "@/lib/types";
import { useAppStore } from "@/store/app";
import { useCreateNote } from "@/hooks/useCreateNote";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/misc";

export function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const navigate = useAppStore((s) => s.navigate);
  const openNote = useAppStore((s) => s.openNote);
  const createNote = useCreateNote();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const { data: results = [] } = useQuery({
    queryKey: api.qk.search(debounced),
    queryFn: () => api.searchMeetings(debounced),
    enabled: open && debounced.length > 0,
  });

  const { data: recent = [] } = useQuery({
    queryKey: api.qk.meetings(),
    queryFn: () => api.listMeetings(),
    enabled: open,
  });

  const notes = debounced ? results : recent.slice(0, 5);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent bare className="max-w-[520px]" aria-label="Command palette">
        <Command
          shouldFilter={false}
          className="overflow-hidden rounded-2xl border border-border bg-elevated shadow-xl"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-subtle" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search notes or jump to…"
              className="h-11 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-subtle"
            />
            <Kbd>ESC</Kbd>
          </div>

          <Command.List className="max-h-[340px] overflow-y-auto p-1.5">
            <Command.Empty className="px-3 py-6 text-center text-[13px] text-subtle">
              No results for “{debounced}”
            </Command.Empty>

            {notes.length > 0 && (
              <Command.Group
                heading={debounced ? "Notes" : "Recent"}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
              >
                {notes.map((note) => (
                  <Item key={note.id} onSelect={() => run(() => openNote(note.id))}>
                    <FileText className="size-4 text-subtle" />
                    <span className="min-w-0 flex-1 truncate">{note.title || "Untitled"}</span>
                    <span className="text-[11px] text-subtle">{formatDayLabel(note.date)}</span>
                  </Item>
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Actions"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
            >
              <Item onSelect={() => run(() => createNote.mutate({}))}>
                <Plus className="size-4 text-subtle" />
                New note
              </Item>
              <Item onSelect={() => run(() => createNote.mutate({ record: true }))}>
                <Mic className="size-4 text-subtle" />
                New note and start recording
              </Item>
            </Command.Group>

            <Command.Group
              heading="Go to"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle"
            >
              <Item onSelect={() => run(() => navigate({ kind: "home" }))}>
                <Home className="size-4 text-subtle" />
                Home
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "space", spaceId: MY_NOTES_SPACE }))}>
                <FileText className="size-4 text-subtle" />
                My notes
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "chat", sessionId: null }))}>
                <MessageSquare className="size-4 text-subtle" />
                Chat
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "shared" }))}>
                <Users className="size-4 text-subtle" />
                Shared with me
              </Item>
              <Item onSelect={() => run(() => navigate({ kind: "settings", tab: "preferences" }))}>
                <Settings className="size-4 text-subtle" />
                Settings
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
      className="flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-text outline-none data-[selected=true]:bg-hover"
    >
      {children}
    </Command.Item>
  );
}
