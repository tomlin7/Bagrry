import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { NotePage } from "./NotePage";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getMeeting: vi.fn().mockResolvedValue({
      id: "note_123",
      title: "Product Strategy & Architecture Sync",
      date: new Date().toISOString(),
      scratchpad_raw: "Discussion about local SQLite storage\n- [x] Implement WAL mode",
      scratchpad_json: null,
      enhanced_notes_json: JSON.stringify({
        sections: [
          {
            section_title: "Executive Summary",
            bullet_points: [
              {
                text: "Agreed to use local SQLite with WAL mode for all offline meeting storage.",
                citations: ["s_001"],
              },
            ],
          },
        ],
      }),
      folder_id: null,
    }),
    listMeetingAttendees: vi.fn().mockResolvedValue([]),
    listFolders: vi.fn().mockResolvedValue([]),
    listTemplates: vi.fn().mockResolvedValue([
      {
        id: "tpl_1on1",
        name: "1-on-1 Sync",
        icon: "users",
        prompt_template: "Catch-up notes and action items.",
        structure_json: JSON.stringify({ sections: ["Catch-up", "Action Items"] }),
      },
      {
        id: "tpl_arch",
        name: "Technical Architecture Review",
        icon: "code",
        prompt_template: "ADR style.",
        structure_json: JSON.stringify({ sections: ["Decisions", "Next Steps"] }),
      },
    ]),
    listRecipes: vi.fn().mockResolvedValue([]),
    listPeople: vi.fn().mockResolvedValue([]),
    listSegments: vi.fn().mockResolvedValue([]),
    saveScratchpad: vi.fn().mockResolvedValue(undefined),
    saveEnhancedNotes: vi.fn().mockResolvedValue(undefined),
    saveTitle: vi.fn().mockResolvedValue(undefined),
    enhanceMeeting: vi.fn().mockResolvedValue(undefined),
  };
});

describe("NotePage Dual-Pane Editor & Templates", () => {
  it("renders dual-pane split view with scratchpad and enhanced sections by default", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <NotePage noteId="note_123" />
        </QueryClientProvider>
      </TooltipProvider>,
    );

    // Verify title and view mode buttons
    expect(await screen.findByDisplayValue("Product Strategy & Architecture Sync")).toBeDefined();
    expect(screen.getByText("Split")).toBeDefined();
    expect(screen.getByText("Notes")).toBeDefined();
    expect(screen.getByText("Enhanced")).toBeDefined();

    // Verify scratchpad and enhanced subheaders
    expect(await screen.findByText("Raw Scratchpad")).toBeDefined();
    expect(screen.getByText("AI Enhanced")).toBeDefined();

    // Verify content rendered
    expect(await screen.findByText("Executive Summary")).toBeDefined();
    expect(
      screen.getByText("Agreed to use local SQLite with WAL mode for all offline meeting storage."),
    ).toBeDefined();
  });

  it("switches view modes when clicking pills or using keyboard shortcuts", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <NotePage noteId="note_123" />
        </QueryClientProvider>
      </TooltipProvider>,
    );

    // Initial render
    expect(await screen.findByText("Raw Scratchpad")).toBeDefined();

    // Switch to Notes only
    fireEvent.click(screen.getByText("Notes"));
    expect(screen.queryByText("Raw Scratchpad")).toBeNull(); // Subheaders are hidden in single view

    // Switch via Ctrl+3 to Enhanced only
    fireEvent.keyDown(window, { key: "3", ctrlKey: true });
    expect(await screen.findByText("Executive Summary")).toBeDefined();

    // Switch back to Split via Ctrl+1
    fireEvent.keyDown(window, { key: "1", ctrlKey: true });
    expect(await screen.findByText("Raw Scratchpad")).toBeDefined();
    expect(await screen.findByText("AI Enhanced")).toBeDefined();
  });

  it("supports dynamic re-enhancement with specialized meeting templates", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <NotePage noteId="note_123" />
        </QueryClientProvider>
      </TooltipProvider>,
    );

    expect(await screen.findByText("AI Enhanced")).toBeDefined();

    // Re-Enhance button present
    const reEnhanceBtn = await screen.findByRole("button", { name: /Re-Enhance/i });
    expect(reEnhanceBtn).toBeDefined();
    fireEvent.click(reEnhanceBtn);

    await waitFor(() => {
      expect(api.enhanceMeeting).toHaveBeenCalled();
    });
  });
});
