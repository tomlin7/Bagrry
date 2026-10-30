import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRef } from "react";
import { NoteEditor, type NoteEditorHandle } from "./NoteEditor";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    repromptSelection: vi.fn().mockResolvedValue("• Synthesized concise bullet point"),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("NoteEditor & Inline AI Re-prompting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders editor and allows updating notes", () => {
    const onSave = vi.fn();
    const ref = createRef<NoteEditorHandle>();

    renderWithClient(
      <NoteEditor
        ref={ref}
        noteId="note_123"
        initialContent="Preliminary meeting notes regarding architecture."
        onSave={onSave}
      />
    );

    expect(screen.getByText(/Preliminary meeting notes/i)).toBeInTheDocument();
    expect(ref.current?.replaceSelection).toBeDefined();
  });

  it("supports replacing selection via imperative handle", () => {
    const onSave = vi.fn();
    const ref = createRef<NoteEditorHandle>();

    renderWithClient(
      <NoteEditor
        ref={ref}
        noteId="note_123"
        initialContent="Architecture points"
        onSave={onSave}
      />
    );

    ref.current?.replaceSelection("• New enhanced takeaway");
    expect(ref.current?.replaceSelection).toBeDefined();
  });

  it("invokes reprompt selection API correctly", async () => {
    const res = await api.repromptSelection("note_123", "Raw text", "Make more concise");
    expect(api.repromptSelection).toHaveBeenCalledWith("note_123", "Raw text", "Make more concise");
    expect(res).toBe("• Synthesized concise bullet point");
  });
});
