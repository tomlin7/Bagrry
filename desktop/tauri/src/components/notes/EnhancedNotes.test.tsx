import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { EnhancedNotes, extractCitationIds } from "./EnhancedNotes";
import { useAudioPlayerStore } from "@/store/audio";
import { useAppStore } from "@/store/app";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listSegments: vi.fn().mockResolvedValue([
      {
        id: "seg_1",
        speaker: "me",
        start_ms: 12000,
        end_ms: 18000,
        text: "We should store all notes locally in SQLite with WAL mode.",
        sentence_index: 0,
        sentence_id: "s_001",
      },
      {
        id: "seg_2",
        speaker: "attendees",
        start_ms: 19000,
        end_ms: 25000,
        text: "Agreed, local storage guarantees zero latency and offline reliability.",
        sentence_index: 1,
        sentence_id: "s_002",
      },
    ]),
  };
});

describe("EnhancedNotes & Citations", () => {
  beforeEach(() => {
    useAudioPlayerStore.getState().close();
    useAppStore.setState({ highlightSentenceId: null, transcriptOpen: false });
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("extracts inline citation tokens like [cite s_001] properly", () => {
    const raw = "Discussion on local SQLite storage [cite s_001] with WAL mode.";
    const { cleanText, citationIds } = extractCitationIds(raw, ["s_002"]);
    expect(cleanText).toBe("Discussion on local SQLite storage with WAL mode.");
    expect(citationIds).toContain("s_001");
    expect(citationIds).toContain("s_002");
  });

  it("renders citation pills and displays popover with quote and audio controls", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const docJson = JSON.stringify({
      sections: [
        {
          section_title: "Architecture Decisions",
          bullet_points: [
            {
              text: "Store notes locally in SQLite with WAL mode.",
              citations: ["s_001"],
            },
          ],
        },
      ],
    });

    render(
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <EnhancedNotes noteId="mtg_test" json={docJson} />
        </QueryClientProvider>
      </TooltipProvider>,
    );

    // Section title and bullet point rendered
    expect(await screen.findByText("Architecture Decisions")).toBeDefined();
    expect(screen.getByText("Store notes locally in SQLite with WAL mode.")).toBeDefined();

    // Citation pill rendered with index and timestamp
    const citationButton = await screen.findByRole("button", { name: /Citation s_001/i });
    expect(citationButton).toBeDefined();
    expect(screen.getByText("00:12")).toBeDefined();

    // Click to open citation popover
    fireEvent.click(citationButton);

    // Verbatim text in popover
    expect(
      await screen.findByText("“We should store all notes locally in SQLite with WAL mode.”"),
    ).toBeDefined();
    expect(screen.getByText("Speaker: Me")).toBeDefined();

    // Click "Play from here"
    const playBtn = screen.getByRole("button", { name: /Play from here/i });
    fireEvent.click(playBtn);

    // Verifies audio player started at 12000ms
    const audioState = useAudioPlayerStore.getState();
    expect(audioState.isPlaying).toBe(true);
    expect(audioState.activeMeetingId).toBe("mtg_test");
    expect(audioState.currentTimeMs).toBe(12000);

    // Click "Copy quote & citation"
    const copyBtn = screen.getByRole("button", { name: /Copy quote & citation/i });
    fireEvent.click(copyBtn);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("We should store all notes locally in SQLite"),
      );
    });

    // Click "View in transcript"
    const viewTranscriptBtn = screen.getByRole("button", { name: /View in transcript/i });
    fireEvent.click(viewTranscriptBtn);

    // Verifies transcript open and sentence highlighted
    const appState = useAppStore.getState();
    expect(appState.transcriptOpen).toBe(true);
    expect(appState.highlightSentenceId).toBe("s_001");
  });
});
