import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Download,
  FolderInput,
  MoreHorizontal,
  Share2,
  Sparkles,
  Trash2,
  Users,
  Webhook,
} from "lucide-react";
import * as api from "@/lib/api";
import { formatDayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { EnhancedNotes } from "@/components/notes/EnhancedNotes";
import { TranscriptPanel } from "@/components/notes/TranscriptPanel";
import { RecordingControls } from "@/components/notes/RecordingControls";
import { AskBar } from "@/components/chat/AskBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { snappy } from "@/lib/motion";

type Tab = "notes" | "enhanced";

export function NotePage({ noteId }: { noteId: string }) {
  const queryClient = useQueryClient();
  const back = useAppStore((s) => s.back);
  const transcriptOpen = useAppStore((s) => s.transcriptOpen);
  const setTranscriptOpen = useAppStore((s) => s.setTranscriptOpen);
  const recState = useAppStore((s) => s.recState);

  const [tab, setTab] = useState<Tab>("notes");
  const [selection, setSelection] = useState("");

  const { data: note, isLoading } = useQuery({
    queryKey: api.qk.meeting(noteId),
    queryFn: () => api.getMeeting(noteId),
  });

  const { data: attendees = [] } = useQuery({
    queryKey: api.qk.attendees(noteId),
    queryFn: () => api.listMeetingAttendees(noteId),
  });

  const { data: folders = [] } = useQuery({ queryKey: api.qk.folders(), queryFn: api.listFolders });
  const { data: templates = [] } = useQuery({ queryKey: api.qk.templates(), queryFn: api.listTemplates });

  const saveBody = useMutation({
    mutationFn: (html: string) => api.saveScratchpad(noteId, html),
    onError: (e) => toast.error(e, "Your latest edits may not be saved."),
  });

  const saveTitle = useMutation({
    mutationFn: (title: string) => api.saveTitle(noteId, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.meeting(noteId) });
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (e) => toast.error(e),
  });

  const enhance = useMutation({
    mutationFn: (templateId: string | null) => api.enhanceMeeting(noteId, templateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.meeting(noteId) });
      setTab("enhanced");
      toast.success("Notes enhanced");
    },
    onError: (e) => toast.error(e),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteMeeting(noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      back();
      toast.success("Note deleted");
    },
    onError: (e) => toast.error(e),
  });

  const move = useMutation({
    mutationFn: (folderId: string | null) => api.moveMeeting(noteId, folderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.meeting(noteId) });
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Note moved");
    },
    onError: (e) => toast.error(e),
  });

  const share = useMutation({
    mutationFn: () => api.createShare(noteId),
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

  const exportMd = useMutation({
    mutationFn: () => api.exportMarkdown(noteId),
    onSuccess: async (markdown) => {
      try {
        await navigator.clipboard.writeText(markdown);
        toast.success("Markdown copied to clipboard");
      } catch (error) {
        toast.error(error);
      }
    },
    onError: (e) => toast.error(e),
  });

  const webhook = useMutation({
    mutationFn: () => api.dispatchWebhook(noteId),
    onSuccess: (result) => toast.success("Webhook sent", result),
    onError: (e) => toast.error(e, "Set a webhook URL in Settings first."),
  });

  const reprompt = useMutation({
    mutationFn: (instruction: string) => api.repromptSelection(noteId, selection, instruction),
    onSuccess: (result) => toast.info("Rewrite suggestion", result.slice(0, 240)),
    onError: (e) => toast.error(e),
  });

  const ask = useMutation({
    mutationFn: (question: string) => api.askBagrry(question, null, noteId),
    onSuccess: (answer) => toast.info("Answer", answer.slice(0, 400)),
    onError: (e) => toast.error(e),
  });

  // Opening a note while it is the one being recorded should reveal the panel.
  const recordingMeetingId = useAppStore((s) => s.recordingMeetingId);
  useEffect(() => {
    if (recState !== "idle" && recordingMeetingId === noteId) setTranscriptOpen(true);
  }, [noteId, recState, recordingMeetingId, setTranscriptOpen]);

  if (isLoading || !note) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-6 pt-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-3 h-5 w-40" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  const hasEnhanced = Boolean(note.enhanced_notes_json);
  const currentFolder = folders.find((f) => f.id === note.folder_id);

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[640px] px-6 pb-[22rem] pt-4">
          <TitleField
            key={noteId}
            value={note.title}
            onCommit={(next) => next !== note.title && saveTitle.mutate(next)}
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip icon={<CalendarDays className="size-3" />} label={formatDayLabel(note.date)} />
            <Chip
              icon={<Users className="size-3" />}
              label={attendees.length > 0 ? attendees.map((a) => a.name).join(", ") : "Me"}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Move to folder"
                  className="flex h-6 items-center gap-1 rounded-full border border-border px-2 text-[11px] text-muted transition-colors hover:border-border-strong hover:text-text"
                >
                  <FolderInput className="size-3" />
                  {currentFolder?.name ?? "Inbox"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => move.mutate(null)}>Inbox</DropdownMenuItem>
                {folders.map((folder) => (
                  <DropdownMenuItem key={folder.id} onSelect={() => move.mutate(folder.id)}>
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {hasEnhanced && (
              <div className="flex rounded-full border border-border p-0.5">
                <TabButton active={tab === "notes"} onClick={() => setTab("notes")}>
                  My notes
                </TabButton>
                <TabButton active={tab === "enhanced"} onClick={() => setTab("enhanced")}>
                  Enhanced
                </TabButton>
              </div>
            )}

            <EnhanceButton
              templates={templates}
              loading={enhance.isPending}
              onEnhance={(templateId) => enhance.mutate(templateId)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Note actions"
                  className="grid size-6 place-items-center rounded-full text-subtle transition-colors hover:bg-hover hover:text-text"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => share.mutate()}>
                  <Share2 />
                  Copy share link
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportMd.mutate()}>
                  <Download />
                  Copy as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => webhook.mutate()}>
                  <Webhook />
                  Send to webhook
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => remove.mutate()}>
                  <Trash2 />
                  Delete note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab === "enhanced" && hasEnhanced ? "enhanced" : "notes"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={snappy}
              >
                {tab === "enhanced" && hasEnhanced ? (
                  <EnhancedNotes noteId={noteId} json={note.enhanced_notes_json} />
                ) : (
                  <NoteEditor
                    noteId={noteId}
                    initialContent={note.scratchpad_raw}
                    onSave={(html) => saveBody.mutate(html)}
                    onSelectionChange={setSelection}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selection && tab === "notes" && (
          <SelectionToolbar
            busy={reprompt.isPending}
            onInstruction={(instruction) => reprompt.mutate(instruction)}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-4">
        <AnimatePresence mode="wait" initial={false}>
          {transcriptOpen ? (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={snappy}
            >
              <TranscriptPanel noteId={noteId} />
            </motion.div>
          ) : (
            <motion.div
              key="askbar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={snappy}
              className="pointer-events-auto mx-auto flex w-full max-w-[640px] items-center gap-2"
            >
              <div className="rounded-full border border-border bg-surface px-2.5 py-1.5 shadow-md">
                <RecordingControls noteId={noteId} compact />
              </div>
              <AskBar
                className="flex-1"
                placeholder="Ask anything"
                showModel={false}
                busy={ask.isPending}
                onSubmit={(value) => ask.mutate(value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Uncontrolled so typing never fights the autosave round-trip. */
function TitleField({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      defaultValue={value}
      placeholder="New note"
      spellCheck={false}
      onBlur={(e) => onCommit(e.target.value.trim() || "Untitled")}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onInput={(e) => {
        const el = e.currentTarget;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }}
      className="font-display w-full resize-none overflow-hidden bg-transparent text-[26px] font-semibold leading-tight text-text outline-none placeholder:text-subtle"
    />
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex h-6 max-w-[14rem] items-center gap-1 rounded-full border border-border px-2 text-[11px] text-muted">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-5 rounded-full px-2 text-[11px] font-medium transition-colors",
        active ? "bg-selected text-text" : "text-subtle hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function EnhanceButton({
  templates,
  loading,
  onEnhance,
}: {
  templates: { id: string; name: string }[];
  loading: boolean;
  onEnhance: (templateId: string | null) => void;
}) {
  return (
    <DropdownMenu>
      <Tooltip label="Enhance notes with AI">
        <DropdownMenuTrigger asChild>
          <Button variant="subtle" size="xs" loading={loading}>
            <Sparkles />
            Enhance
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Template</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onEnhance(null)}>Default summary</DropdownMenuItem>
        {templates.map((template) => (
          <DropdownMenuItem key={template.id} onSelect={() => onEnhance(template.id)}>
            {template.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const REWRITE_ACTIONS = ["Tighten", "Make it a list", "Expand"] as const;

function SelectionToolbar({
  busy,
  onInstruction,
}: {
  busy: boolean;
  onInstruction: (instruction: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={snappy}
      className="pointer-events-none absolute inset-x-0 top-3 flex justify-center"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-elevated px-1.5 py-1 shadow-lg">
        <Sparkles className="ml-1 size-3.5 text-accent" />
        {REWRITE_ACTIONS.map((action) => (
          <Button
            key={action}
            variant="ghost"
            size="xs"
            disabled={busy}
            onClick={() => onInstruction(action)}
          >
            {action}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
