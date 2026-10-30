import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useMutation } from "@tanstack/react-query";
import {
  Bold,
  CornerDownLeft,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Sparkles,
  SquareCheck,
  Strikethrough,
} from "lucide-react";
import * as api from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const AUTOSAVE_MS = 300;

export type NoteDraft = {
  text: string;
  json: string;
};

export type NoteEditorHandle = {
  replaceSelection: (text: string) => void;
};

function toEditorContent(json: string | null | undefined, raw: string): string | Record<string, unknown> {
  if (json) {
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>;
      if (parsed && parsed.type === "doc") return parsed;
    } catch {
      /* fall through to plaintext / html */
    }
  }
  if (!raw) return "";
  if (raw.trimStart().startsWith("<")) return raw;
  return raw
    .split(/\n{2,}/)
    .map((block) => {
      const escaped = block
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      return `<p>${escaped}</p>`;
    })
    .join("");
}

const SLASH_ITEMS = [
  { id: "h1", label: "Heading 1", icon: Heading1, run: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: "h2", label: "Heading 2", icon: Heading2, run: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: "bullet", label: "Bullet list", icon: List, run: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { id: "number", label: "Numbered list", icon: ListOrdered, run: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { id: "todo", label: "To-do", icon: SquareCheck, run: (e: Editor) => e.chain().focus().toggleTaskList().run() },
  { id: "quote", label: "Quote", icon: Quote, run: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { id: "hr", label: "Divider", icon: Minus, run: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
] as const;

export const NoteEditor = forwardRef<
  NoteEditorHandle,
  {
    noteId: string;
    initialContent: string;
    initialJson?: string | null;
    onSave: (draft: NoteDraft) => void;
    onSelectionChange?: (text: string) => void;
    onStatsChange?: (stats: { words: number; chars: number }) => void;
    onSaveStatusChange?: (status: "saved" | "saving") => void;
  }
>(function NoteEditor(
  {
    noteId,
    initialContent,
    initialJson,
    onSave,
    onSelectionChange,
    onStatsChange,
    onSaveStatusChange,
  },
  ref,
) {
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef<NoteDraft>({ text: initialContent, json: initialJson ?? "" });
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const onSaveStatusChangeRef = useRef(onSaveStatusChange);
  onSaveStatusChangeRef.current = onSaveStatusChange;
  const onStatsChangeRef = useRef(onStatsChange);
  onStatsChangeRef.current = onStatsChange;
  const [slash, setSlash] = useState<{ query: string; from: number } | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const repromptMutation = useMutation({
    mutationFn: async (instruction: string) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      if (!selectedText.trim()) throw new Error("No text selected");

      const result = await api.repromptSelection(noteId, selectedText, instruction);
      return { selectedText, result };
    },
    onSuccess: (data) => {
      if (!editor || !data) return;
      editor.chain().focus().insertContent(data.result.replace(/\n/g, "<br>")).run();
      persist(editor);
      setShowAiPrompt(false);
      setCustomPrompt("");
      toast.success("Selection rewritten with AI!");
    },
    onError: (err) => {
      toast.error(typeof err === "string" ? err : "Failed to rewrite selection");
    },
  });

  const persist = (instance: Editor) => {
    const text = instance.getText();
    latest.current = {
      text,
      json: JSON.stringify(instance.getJSON()),
    };
    onSaveStatusChangeRef.current?.("saving");
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    onStatsChangeRef.current?.({ words, chars: text.length });
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSaveRef.current(latest.current);
      onSaveStatusChangeRef.current?.("saved");
    }, AUTOSAVE_MS);
  };

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: "Write notes, or type / for commands" }),
      ],
      content: toEditorContent(initialJson, initialContent),
      editorProps: {
        attributes: { class: "tiptap" },
        handleKeyDown: (_view, event) => {
          if (!slash) return false;
          const matches = SLASH_ITEMS.filter((item) =>
            item.label.toLowerCase().includes(slash.query.toLowerCase()),
          );
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSlashIndex((i) => (i + 1) % Math.max(matches.length, 1));
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSlashIndex((i) => (i - 1 + Math.max(matches.length, 1)) % Math.max(matches.length, 1));
            return true;
          }
          if (event.key === "Enter" && matches[slashIndex]) {
            event.preventDefault();
            return true;
          }
          if (event.key === "Escape") {
            setSlash(null);
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: instance }) => {
        persist(instance);
        const { from } = instance.state.selection;
        const textBefore = instance.state.doc.textBetween(Math.max(0, from - 32), from, "\n");
        const match = textBefore.match(/(?:^|\n)\/([^\n/]*)$/);
        if (match) {
          setSlash({ query: match[1] ?? "", from: from - match[0].replace(/^\n/, "").length });
          setSlashIndex(0);
        } else {
          setSlash(null);
        }
      },
      onSelectionUpdate: ({ editor: instance }) => {
        if (!onSelectionChange) return;
        const { from, to } = instance.state.selection;
        onSelectionChange(from === to ? "" : instance.state.doc.textBetween(from, to, " "));
      },
    },
    [noteId],
  );

  useImperativeHandle(ref, () => ({
    replaceSelection: (text: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(text.replace(/\n/g, "<br>")).run();
      persist(editor);
    },
  }));

  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      if (latest.current.json || latest.current.text !== initialContent) {
        onSaveRef.current(latest.current);
      }
    },
    [initialContent, noteId],
  );

  const slashMatches = SLASH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes((slash?.query ?? "").toLowerCase()),
  );

  const applySlash = (item: (typeof SLASH_ITEMS)[number]) => {
    if (!editor || !slash) return;
    const to = editor.state.selection.from;
    editor.chain().focus().deleteRange({ from: slash.from, to }).run();
    item.run(editor);
    setSlash(null);
  };

  useEffect(() => {
    if (!editor || !slash) return;
    const onEnter = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || !slashMatches[slashIndex]) return;
      event.preventDefault();
      applySlash(slashMatches[slashIndex]);
    };
    document.addEventListener("keydown", onEnter, true);
    return () => document.removeEventListener("keydown", onEnter, true);
  });

  return (
    <div className="relative">
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex flex-col gap-1.5 rounded-2xl border border-border bg-elevated p-1 shadow-xl max-w-sm"
        >
          <div className="flex items-center gap-0.5">
            <MarkButton
              label="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="size-3.5" />
            </MarkButton>
            <MarkButton
              label="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="size-3.5" />
            </MarkButton>
            <MarkButton
              label="Strike"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="size-3.5" />
            </MarkButton>
            <MarkButton
              label="Bullet list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="size-3.5" />
            </MarkButton>

            <div className="w-px h-4 bg-border/80 mx-1" />

            <button
              type="button"
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                showAiPrompt
                  ? "bg-accent text-white"
                  : "bg-accent/10 text-accent hover:bg-accent/20"
              )}
            >
              <Sparkles className="size-3.5" />
              <span>Ask AI</span>
            </button>
          </div>

          {showAiPrompt && (
            <div className="flex flex-col gap-2 p-2 border-t border-border/60 bg-surface/50 rounded-xl">
              <div className="flex flex-wrap gap-1">
                {[
                  "Make more concise",
                  "Executive summary",
                  "Extract key decisions",
                  "Format as bullet list",
                  "Professional tone",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={repromptMutation.isPending}
                    onClick={() => repromptMutation.mutate(chip)}
                    className="px-2 py-0.5 rounded-full text-[11px] bg-hover hover:bg-selected text-text transition-colors border border-border/40"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customPrompt.trim()) {
                      e.preventDefault();
                      repromptMutation.mutate(customPrompt.trim());
                    }
                  }}
                  placeholder="Ask AI to edit selection..."
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-bg border border-border text-text placeholder:text-subtle focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  disabled={repromptMutation.isPending || !customPrompt.trim()}
                  onClick={() => repromptMutation.mutate(customPrompt.trim())}
                  className="px-2.5 py-1 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center gap-1"
                >
                  {repromptMutation.isPending ? "Editing..." : <CornerDownLeft className="size-3" />}
                </button>
              </div>
            </div>
          )}
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="min-h-[40vh]" />

      {slash && slashMatches.length > 0 && (
        <div className="absolute left-0 top-8 z-20 w-56 overflow-hidden rounded-xl border border-border bg-elevated p-1 shadow-lg">
          <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-subtle">Insert</p>
          {slashMatches.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applySlash(item);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px]",
                index === slashIndex ? "bg-hover text-text" : "text-muted hover:bg-hover hover:text-text",
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

function MarkButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-full transition-colors",
        active ? "bg-selected text-text" : "text-muted hover:bg-hover hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
