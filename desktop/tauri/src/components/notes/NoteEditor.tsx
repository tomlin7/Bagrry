import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Bold, Heading1, Heading2, Italic, List, ListOrdered, Minus, Quote, SquareCheck, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTOSAVE_MS = 600;

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
  }
>(function NoteEditor({ noteId, initialContent, initialJson, onSave, onSelectionChange }, ref) {
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef<NoteDraft>({ text: initialContent, json: initialJson ?? "" });
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const [slash, setSlash] = useState<{ query: string; from: number } | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);

  const persist = (instance: Editor) => {
    latest.current = {
      text: instance.getText(),
      json: JSON.stringify(instance.getJSON()),
    };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSaveRef.current(latest.current), AUTOSAVE_MS);
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
        <BubbleMenu editor={editor} className="flex items-center gap-0.5 rounded-full border border-border bg-elevated px-1 py-0.5 shadow-lg">
          <MarkButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="size-3.5" />
          </MarkButton>
          <MarkButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="size-3.5" />
          </MarkButton>
          <MarkButton label="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="size-3.5" />
          </MarkButton>
          <MarkButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="size-3.5" />
          </MarkButton>
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
