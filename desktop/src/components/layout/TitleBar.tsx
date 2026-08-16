import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, PanelLeft, Plus } from "lucide-react";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { WindowControls } from "./WindowControls";
import { useCreateNote } from "@/hooks/useCreateNote";
import { AnimatePresence, motion } from "framer-motion";
import { snappy } from "@/lib/motion";

/**
 * The one horizontal strip at the top of the content column. Everything that
 * isn't a button is a drag handle, since the OS title bar is disabled.
 */
export function TitleBar() {
  const route = useAppStore((s) => s.route);
  const history = useAppStore((s) => s.history);
  const back = useAppStore((s) => s.back);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const recState = useAppStore((s) => s.recState);

  const createNote = useCreateNote();
  const showNewNote = route.kind === "home" || route.kind === "space" || route.kind === "shared";

  if (route.kind === "settings") {
    return (
      <header data-tauri-drag-region className="relative flex h-11 shrink-0 items-center pl-3 pr-0">
        <Tooltip label="Back" shortcut="Alt+←">
          <button
            type="button"
            aria-label="Back"
            onClick={back}
            className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-hover hover:text-text"
          >
            <ChevronLeft className="size-4" />
          </button>
        </Tooltip>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-[13px] font-medium text-text">
          Settings
        </div>
        <div data-tauri-drag-region className="h-full flex-1" />
        <WindowControls />
      </header>
    );
  }

  return (
    <header data-tauri-drag-region className="flex h-11 shrink-0 items-center gap-2 pl-3 pr-0">
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5">
        <AnimatePresence initial={false}>
          {history.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 24, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={snappy}
              className="overflow-hidden"
            >
              <Tooltip label="Back" shortcut="Alt+←">
                <button
                  type="button"
                  aria-label="Back"
                  onClick={back}
                  className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-hover hover:text-text"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
        <Tooltip label={sidebarOpen ? "Hide sidebar" : "Show sidebar"} shortcut="Ctrl+\">
          <button
            type="button"
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            onClick={toggleSidebar}
            className={cn(
              "grid size-6 place-items-center rounded-md transition-colors hover:bg-hover hover:text-text",
              sidebarOpen ? "text-text" : "text-muted",
            )}
          >
            <PanelLeft className="size-3.5" />
          </button>
        </Tooltip>
      </div>

      {recState !== "idle" && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={snappy}>
          <RecordingPill />
        </motion.div>
      )}

      <div data-tauri-drag-region className="h-full flex-1" />

      {showNewNote && (
        <Button
          variant="solid"
          size="sm"
          className="mr-2"
          onClick={() => createNote.mutate({})}
          loading={createNote.isPending}
        >
          <Plus />
          New note
        </Button>
      )}

      {route.kind === "note" && <NoteTitleBarActions noteId={route.noteId} />}

      <WindowControls />
    </header>
  );
}

function RecordingPill() {
  const recState = useAppStore((s) => s.recState);
  const openNote = useAppStore((s) => s.openNote);
  const meetingId = useAppStore((s) => s.recordingMeetingId);

  return (
    <button
      type="button"
      onClick={() => meetingId && openNote(meetingId)}
      className="flex h-6 items-center gap-1.5 rounded-full bg-danger/12 px-2 text-[11px] font-medium text-danger transition-colors hover:bg-danger/20"
    >
      <span className={cn("size-1.5 rounded-full bg-danger", recState === "recording" && "animate-pulse-ring")} />
      {recState === "recording" ? "Recording" : "Paused"}
    </button>
  );
}

function NoteTitleBarActions({ noteId }: { noteId: string }) {
  const { data: note } = useQuery({
    queryKey: api.qk.meeting(noteId),
    queryFn: () => api.getMeeting(noteId),
  });

  if (!note) return null;

  return (
    <div className="mr-2 flex items-center gap-1">
      <span className="max-w-[16rem] truncate text-xs text-subtle">{note.title}</span>
    </div>
  );
}
