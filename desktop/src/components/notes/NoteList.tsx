import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Copy, FileText, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { formatDayLabel, formatTime, parseDbDate, previewText } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { Skeleton } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Group = { label: string; notes: Meeting[] };

/** Buckets notes into day groups, newest first, preserving within-day order. */
function groupByDay(notes: Meeting[]): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;

  for (const note of notes) {
    const label = formatDayLabel(note.date);
    if (!current || current.label !== label) {
      current = { label, notes: [] };
      groups.push(current);
    }
    current.notes.push(note);
  }
  return groups;
}

export function NoteList({
  notes,
  loading,
  emptyState,
  className,
}: {
  notes: Meeting[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}) {
  const groups = useMemo(() => groupByDay(notes), [notes]);

  if (loading) {
    return (
      <div className={cn("space-y-1", className)}>
        <Skeleton className="mb-2 h-3 w-14" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="size-7 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) return <>{emptyState}</>;

  return (
    <div className={className}>
      {groups.map((group) => (
        <section key={group.label} className="mb-4">
          <h3 className="px-2 pb-1 text-[11px] font-semibold text-subtle">{group.label}</h3>
          <div>
            {group.notes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14, delay: Math.min(i * 0.03, 0.18) }}
              >
                <NoteRow note={note} />
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function NoteRow({ note }: { note: Meeting }) {
  const openNote = useAppStore((s) => s.openNote);
  const recordingMeetingId = useAppStore((s) => s.recordingMeetingId);
  const recState = useAppStore((s) => s.recState);
  const queryClient = useQueryClient();

  const isRecording = recState !== "idle" && recordingMeetingId === note.id;
  const preview = previewText(note.scratchpad_raw, 90);

  const remove = useMutation({
    mutationFn: () => api.deleteMeeting(note.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Note deleted");
    },
    onError: (e) => toast.error(e),
  });

  const duplicate = useMutation({
    mutationFn: () => api.duplicateMeeting(note.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Note duplicated");
    },
    onError: (e) => toast.error(e),
  });

  const share = useMutation({
    mutationFn: () => api.createShare(note.id),
    onSuccess: async (url) => {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied", url);
      } catch {
        toast.info("Share link created", url);
      }
    },
    onError: (e) => toast.error(e),
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openNote(note.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") openNote(note.id);
      }}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-hover"
    >
      <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-surface text-subtle">
        <FileText className="size-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-text">{note.title || "Untitled"}</span>
          {isRecording && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-danger">
              <span className="size-1.5 rounded-full bg-danger animate-pulse-ring" />
              LIVE
            </span>
          )}
        </div>
        <div className="truncate text-xs text-subtle">{preview || "Me"}</div>
      </div>

      <span className="shrink-0 text-[11px] text-subtle tabular">
        {formatTime(parseDbDate(note.date))}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Note options"
            onClick={(e) => e.stopPropagation()}
            className="grid size-6 shrink-0 place-items-center rounded-md text-subtle opacity-0 transition-opacity hover:bg-active hover:text-text group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => share.mutate()}>
            <Share2 />
            Copy share link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => duplicate.mutate()}>
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => remove.mutate()}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
