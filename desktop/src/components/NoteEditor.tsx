import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

export function NoteEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: toHtml(value),
    onUpdate: ({ editor }) => onChange(editor.getText()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getText();
    if (value !== current && !editor.isFocused) {
      editor.commands.setContent(toHtml(value), { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;
  return (
    <div className="prose prose-sm h-full min-w-0 max-w-none overflow-x-hidden overflow-y-auto">
      <EditorContent editor={editor} className="min-h-[12rem] outline-none" />
    </div>
  );
}

function toHtml(text: string) {
  if (!text) return "<p></p>";
  if (text.includes("<p>") || text.includes("<h")) return text;
  return `<p>${text.replace(/\n/g, "</p><p>")}</p>`;
}
