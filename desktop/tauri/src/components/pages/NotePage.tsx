import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Columns2,
  Download,
  FileText,
  FolderInput,
  Loader2,
  MoreHorizontal,
  RotateCcw,
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
import { NoteEditor, type NoteEditorHandle } from "@/components/notes/NoteEditor";
import { EnhancedNotes } from "@/components/notes/EnhancedNotes";
import { TranscriptPanel } from "@/components/notes/TranscriptPanel";
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

export type ViewMode = "split" | "notes" | "enhanced";

export function NotePage({ noteId }: { noteId: string }) {
  const queryClient = useQueryClient();
  const back = useAppStore((s) => s.back);
  const transcriptOpen = useAppStore((s) => s.transcriptOpen);
  const setTranscriptOpen = useAppStore((s) => s.setTranscriptOpen);
  const recState = useAppStore((s) => s.recState);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("bagrry:note-view-mode") as ViewMode) || "split";
  });
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    const saved = localStorage.getItem("bagrry:note-split-ratio");
    return saved ? Math.min(75, Math.max(25, parseFloat(saved))) : 50;
  });
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [selection, setSelection] = useState("");
  const editorRef = useRef<NoteEditorHandle>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

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
  const { data: recipes = [] } = useQuery({ queryKey: api.qk.recipes(), queryFn: api.listRecipes });
  const { data: people = [] } = useQuery({ queryKey: api.qk.people(), queryFn: api.listPeople });

  const saveBody = useMutation({
    mutationFn: (draft: { text: string; json: string }) => api.saveScratchpad(noteId, draft.text, draft.json),
    onError: (e) => toast.error(e, "Your latest edits may not be saved."),
  });

  const saveEnhanced = useMutation({
    mutationFn: (json: string) => api.saveEnhancedNotes(noteId, json),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: api.qk.meeting(noteId) }),
    onError: (e) => toast.error(e, "Enhanced notes weren't saved."),
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
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.meeting(noteId) });
      toast.success("Notes enhanced");
      try {
        const followUp = await api.getSetting("suggested_follow_up_emails");
        if (followUp === "1" || followUp === "true") {
          const draft = await api.runRecipe(noteId, "rcp_email");
          try {
            await navigator.clipboard.writeText(draft);
            toast.success("Follow-up email copied");
          } catch {
            toast.info("Follow-up email", draft.slice(0, 280));
          }
        }
      } catch {
        /* recipe optional */
      }
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
      toast.success("Moved");
    },
    onError: (e) => toast.error(e),
  });

  const addAttendee = useMutation({
    mutationFn: (personId: string) => api.addMeetingAttendee(noteId, personId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: api.qk.attendees(noteId) }),
    onError: (e) => toast.error(e),
  });

  const share = useMutation({
    mutationFn: () => api.createShare(noteId),
    onSuccess: async (url) => {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied");
      } catch {
        toast.info("Share URL", url);
      }
    },
    onError: (e) => toast.error(e),
  });

  const exportMd = useMutation({
    mutationFn: () => api.exportMarkdown(noteId),
    onSuccess: async (md) => {
      try {
        await navigator.clipboard.writeText(md);
        toast.success("Markdown copied to clipboard");
      } catch {
        toast.info("Markdown", md.slice(0, 200));
      }
    },
    onError: (e) => toast.error(e),
  });

  const webhook = useMutation({
    mutationFn: () => api.dispatchWebhook(noteId),
    onSuccess: () => toast.success("Sent to webhook"),
    onError: (e) => toast.error(e),
  });

  const recipe = useMutation({
    mutationFn: (recipeId: string) => api.runRecipe(noteId, recipeId),
    onSuccess: async (result) => {
      try {
        await navigator.clipboard.writeText(result);
        toast.success("Recipe result copied");
      } catch {
        toast.info("Result", result.slice(0, 280));
      }
    },
    onError: (e) => toast.error(e),
  });

  const reprompt = useMutation({
    mutationFn: (instruction: string) => api.repromptSelection(noteId, selection, instruction),
    onSuccess: (replacement) => {
      editorRef.current?.replaceSelection(replacement);
      setSelection("");
      toast.success("Replaced");
    },
    onError: (e) => toast.error(e),
  });

  const ask = useMutation({
    mutationFn: async (question: string) => {
      if (recState !== "idle") {
        const segs = await api.listSegments(noteId);
        const live = segs.map((s) => `${s.speaker}: ${s.text}`).join("\n");
        return api.liveAsk(question, live);
      }
      return api.askBagrry(question, null, noteId);
    },
    onSuccess: (answer) => toast.info("Answer", answer.slice(0, 400)),
    onError: (e) => toast.error(e),
  });

  // Global Keyboard Shortcuts: Ctrl+1 (Split), Ctrl+2 (Notes), Ctrl+3 (Enhanced), Ctrl+Enter (Enhance)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key === "1") {
        e.preventDefault();
        setViewMode("split");
        localStorage.setItem("bagrry:note-view-mode", "split");
      } else if (isCtrl && e.key === "2") {
        e.preventDefault();
        setViewMode("notes");
        localStorage.setItem("bagrry:note-view-mode", "notes");
      } else if (isCtrl && e.key === "3") {
        e.preventDefault();
        setViewMode("enhanced");
        localStorage.setItem("bagrry:note-view-mode", "enhanced");
      } else if (isCtrl && e.key === "Enter" && !e.shiftKey) {
        if (!enhance.isPending) {
          e.preventDefault();
          enhance.mutate(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enhance]);

  // Handle divider dragging
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const initialRatio = splitRatio;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / rect.width) * 100;
      const nextRatio = Math.min(75, Math.max(25, initialRatio + deltaPercent));
      setSplitRatio(nextRatio);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      localStorage.setItem("bagrry:note-split-ratio", splitRatio.toString());
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Opening a note while it is being recorded reveals the panel
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
      {/* Top Header Bar */}
      <div className="border-b border-border bg-bg/80 px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2">
          <TitleField
            key={noteId}
            value={note.title}
            onCommit={(next) => next !== note.title && saveTitle.mutate(next)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Chip icon={<CalendarDays className="size-3" />} label={formatDayLabel(note.date)} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-6 max-w-[14rem] items-center gap-1 rounded-full border border-border px-2 text-[11px] text-muted transition-colors hover:border-border-strong hover:text-text cursor-pointer"
                >
                  <Users className="size-3" />
                  <span className="truncate">
                    {attendees.length > 0 ? attendees.map((a) => a.name).join(", ") : "Add people"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Attendees</DropdownMenuLabel>
                {people
                  .filter((p) => !attendees.some((a) => a.id === p.id))
                  .map((person) => (
                    <DropdownMenuItem key={person.id} onSelect={() => addAttendee.mutate(person.id)}>
                      {person.name}
                    </DropdownMenuItem>
                  ))}
                {people.filter((p) => !attendees.some((a) => a.id === p.id)).length === 0 && (
                  <DropdownMenuItem disabled>Everyone’s already on this note</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Move to folder"
                  className="flex h-6 items-center gap-1 rounded-full border border-border px-2 text-[11px] text-muted transition-colors hover:border-border-strong hover:text-text cursor-pointer"
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

            {/* View Mode Switcher Pills */}
            <div className="flex items-center rounded-full border border-border bg-hover/40 p-0.5">
              <Tooltip label="Split view (Ctrl+1)">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("split");
                    localStorage.setItem("bagrry:note-view-mode", "split");
                  }}
                  className={cn(
                    "flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-all cursor-pointer",
                    viewMode === "split"
                      ? "bg-bg text-text shadow-xs"
                      : "text-muted hover:text-text",
                  )}
                >
                  <Columns2 className="size-3" />
                  <span>Split</span>
                </button>
              </Tooltip>
              <Tooltip label="Scratchpad only (Ctrl+2)">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("notes");
                    localStorage.setItem("bagrry:note-view-mode", "notes");
                  }}
                  className={cn(
                    "flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-all cursor-pointer",
                    viewMode === "notes"
                      ? "bg-bg text-text shadow-xs"
                      : "text-muted hover:text-text",
                  )}
                >
                  <FileText className="size-3" />
                  <span>Notes</span>
                </button>
              </Tooltip>
              <Tooltip label="AI Enhanced only (Ctrl+3)">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("enhanced");
                    localStorage.setItem("bagrry:note-view-mode", "enhanced");
                  }}
                  className={cn(
                    "flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-all cursor-pointer",
                    viewMode === "enhanced"
                      ? "bg-bg text-text shadow-xs"
                      : "text-muted hover:text-text",
                  )}
                >
                  <Sparkles className="size-3" />
                  <span>Enhanced</span>
                </button>
              </Tooltip>
            </div>

            <EnhanceButton
              templates={templates}
              recipes={recipes}
              loading={enhance.isPending || recipe.isPending}
              onEnhance={(templateId) => enhance.mutate(templateId)}
              onRecipe={(id) => recipe.mutate(id)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Note actions"
                  className="grid size-6 place-items-center rounded-full text-subtle transition-colors hover:bg-hover hover:text-text cursor-pointer"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => share.mutate()}>
                  <Share2 className="size-3.5" />
                  Copy share link
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportMd.mutate()}>
                  <Download className="size-3.5" />
                  Copy as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => webhook.mutate()}>
                  <Webhook className="size-3.5" />
                  Send to webhook
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => remove.mutate()}>
                  <Trash2 className="size-3.5" />
                  Delete note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="min-h-0 flex-1 overflow-hidden" ref={splitContainerRef}>
        {viewMode === "split" ? (
          <div className="flex h-full w-full">
            {/* Left Pane: Scratchpad */}
            <div
              style={{ width: `${splitRatio}%` }}
              className="flex h-full flex-col overflow-hidden border-r border-border"
            >
              {/* Scratchpad Subheader */}
              <div className="flex items-center justify-between border-b border-border/60 bg-hover/20 px-6 py-2 text-[11px] text-muted">
                <span className="font-semibold uppercase tracking-wider text-subtle">
                  Raw Scratchpad
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px]">
                    {stats.words} words · {stats.chars} chars
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    {saveStatus === "saving" ? (
                      <>
                        <Loader2 className="size-2.5 animate-spin text-accent" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-2.5 text-emerald-500" />
                        <span className="text-subtle">Saved</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Editor Content Area */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <NoteEditor
                  ref={editorRef}
                  noteId={noteId}
                  initialContent={note.scratchpad_raw}
                  initialJson={note.scratchpad_json}
                  onSave={(draft) => saveBody.mutate(draft)}
                  onSelectionChange={setSelection}
                  onStatsChange={setStats}
                  onSaveStatusChange={setSaveStatus}
                />
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              onMouseDown={handleMouseDownResize}
              className={cn(
                "group relative flex w-2 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-accent/20",
                isResizing && "bg-accent/30",
              )}
            >
              <div className="h-8 w-1 rounded-full bg-border transition-colors group-hover:bg-accent" />
            </div>

            {/* Right Pane: AI Enhanced */}
            <div
              style={{ width: `${100 - splitRatio}%` }}
              className="flex h-full flex-col overflow-hidden bg-bg"
            >
              {/* Enhanced Subheader */}
              <div className="flex items-center justify-between border-b border-border/60 bg-hover/20 px-6 py-2 text-[11px] text-muted">
                <span className="font-semibold uppercase tracking-wider text-subtle">
                  AI Enhanced
                </span>
                <div className="flex items-center gap-2">
                  {hasEnhanced && (
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={enhance.isPending}
                      onClick={() => enhance.mutate(null)}
                      className="h-5 gap-1 text-[10px] text-muted hover:text-text cursor-pointer"
                    >
                      <RotateCcw className="size-2.5" />
                      <span>Regenerate</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Enhanced Content Area */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {hasEnhanced ? (
                  <EnhancedNotes
                    noteId={noteId}
                    json={note.enhanced_notes_json}
                    onChange={(next) => saveEnhanced.mutate(next)}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                      <Sparkles className="size-6" />
                    </div>
                    <h4 className="font-display mb-1.5 text-[15px] font-semibold text-text">
                      No AI synthesis yet
                    </h4>
                    <p className="mb-6 max-w-sm text-[13px] leading-relaxed text-muted">
                      Take notes on the left or record audio. When you&apos;re ready, enhance with AI to generate structured takeaways and verified citations.
                    </p>
                    <Button
                      variant="solid"
                      size="sm"
                      loading={enhance.isPending}
                      onClick={() => enhance.mutate(null)}
                      className="gap-2 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="size-3.5" />
                      <span>Enhance Notes (Ctrl+Enter)</span>
                    </Button>

                    {templates.length > 0 && (
                      <div className="mt-8 flex flex-col items-center gap-2">
                        <span className="text-[11px] text-subtle">Or apply a specialized template:</span>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {templates.slice(0, 3).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => enhance.mutate(t.id)}
                              className="rounded-full border border-border bg-hover/30 px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-border-strong hover:text-text cursor-pointer"
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Single Pane Mode (Notes or Enhanced) */
          <div className="h-full overflow-y-auto px-6 py-6">
            <div className="mx-auto w-full max-w-[760px] pb-32">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={snappy}
                >
                  {viewMode === "enhanced" ? (
                    hasEnhanced ? (
                      <EnhancedNotes
                        noteId={noteId}
                        json={note.enhanced_notes_json}
                        onChange={(next) => saveEnhanced.mutate(next)}
                      />
                    ) : (
                      <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
                        <Sparkles className="mb-3 size-8 text-accent" />
                        <h4 className="font-display mb-1 text-[15px] font-semibold text-text">
                          No AI synthesis yet
                        </h4>
                        <p className="mb-4 text-[13px] text-muted">
                          Press Ctrl+Enter or click Enhance to generate notes.
                        </p>
                        <Button
                          variant="solid"
                          size="sm"
                          loading={enhance.isPending}
                          onClick={() => enhance.mutate(null)}
                        >
                          Enhance Notes
                        </Button>
                      </div>
                    )
                  ) : (
                    <NoteEditor
                      ref={editorRef}
                      noteId={noteId}
                      initialContent={note.scratchpad_raw}
                      initialJson={note.scratchpad_json}
                      onSave={(draft) => saveBody.mutate(draft)}
                      onSelectionChange={setSelection}
                      onStatsChange={setStats}
                      onSaveStatusChange={setSaveStatus}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Floating Selection AI Toolbar */}
      <AnimatePresence>
        {selection && viewMode !== "enhanced" && (
          <SelectionToolbar
            busy={reprompt.isPending}
            onInstruction={(instruction) => reprompt.mutate(instruction)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Floating Bar: Transcript or AskBar */}
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
              <AskBar
                busy={recState !== "idle" || ask.isPending}
                onSubmit={(q: string) => ask.mutate(q)}
                onAttach={async (file) => {
                  await api.saveAttachmentText(noteId, file.name, file.text);
                  toast.success(`Attached ${file.name}`);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Uncontrolled title field so typing never fights autosave round-trips */
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

function EnhanceButton({
  templates,
  recipes,
  loading,
  onEnhance,
  onRecipe,
}: {
  templates: { id: string; name: string }[];
  recipes: { id: string; name: string }[];
  loading: boolean;
  onEnhance: (templateId: string | null) => void;
  onRecipe: (recipeId: string) => void;
}) {
  return (
    <DropdownMenu>
      <Tooltip label="Enhance notes with AI (Ctrl+Enter)">
        <DropdownMenuTrigger asChild>
          <Button variant="subtle" size="xs" loading={loading} className="cursor-pointer">
            <Sparkles className="size-3 text-accent" />
            <span>Enhance</span>
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
        {recipes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Recipes</DropdownMenuLabel>
            {recipes.map((item) => (
              <DropdownMenuItem key={item.id} onSelect={() => onRecipe(item.id)}>
                {item.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
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
            className="cursor-pointer"
          >
            {action}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
