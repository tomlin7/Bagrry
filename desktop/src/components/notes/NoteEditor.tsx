import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

const AUTOSAVE_MS = 600;

/**
 * Notes were historically stored as plain text. Anything that doesn't look
 * like markup is escaped and split into paragraphs so old notes still open.
 */
function toEditorContent(raw: string): string {
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

export function NoteEditor({
  noteId,
  initialContent,
  onSave,
  onSelectionChange,
}: {
  noteId: string;
  initialContent: string;
  onSave: (html: string) => void;
  onSelectionChange?: (text: string) => void;
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestHtml = useRef(initialContent);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: "Write notes" }),
      ],
      content: toEditorContent(initialContent),
      editorProps: { attributes: { class: "tiptap" } },
      onUpdate: ({ editor: instance }) => {
        latestHtml.current = instance.getHTML();
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => onSaveRef.current(latestHtml.current), AUTOSAVE_MS);
      },
      onSelectionUpdate: ({ editor: instance }) => {
        if (!onSelectionChange) return;
        const { from, to } = instance.state.selection;
        onSelectionChange(from === to ? "" : instance.state.doc.textBetween(from, to, " "));
      },
    },
    [noteId],
  );

  // Never let a pending debounce drop the last keystroke on unmount or navigation.
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      if (latestHtml.current !== initialContent) onSaveRef.current(latestHtml.current);
    },
    [initialContent, noteId],
  );

  return <EditorContent editor={editor} className="min-h-[40vh]" />;
}
