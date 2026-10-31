import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranscriptPanel } from "./TranscriptPanel";
import { useAppStore } from "@/store/app";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listSegments: vi.fn(),
    listMeetingAttendees: vi.fn(),
    assignSpeakerName: vi.fn(),
    copyConsent: vi.fn(),
  };
});

describe("Speaker Diarization & Attendee Attribution (#45)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    useAppStore.setState({
      transcriptMinimized: false,
      transcriptOpen: true,
      recState: "idle",
      liveSegments: [],
    });

    vi.mocked(api.listSegments).mockResolvedValue([
      {
        id: "seg_1",
        speaker: "attendees",
        speaker_name: null,
        start_ms: 1000,
        end_ms: 5000,
        text: "We should target next Tuesday for the client rollout.",
        sentence_index: 0,
        sentence_id: "s_001",
      },
      {
        id: "seg_2",
        speaker: "me",
        speaker_name: null,
        start_ms: 5500,
        end_ms: 8000,
        text: "I will coordinate with devops.",
        sentence_index: 1,
        sentence_id: "s_002",
      },
    ]);

    vi.mocked(api.listMeetingAttendees).mockResolvedValue([
      {
        id: "att_1",
        name: "Sarah Connor",
        email: "sarah@skynet.com",
        domain: "skynet.com",
        company_id: "comp_1",
        company_name: "Cyberdyne",
        note_count: 3,
        last_note_at: new Date().toISOString(),
      },
      {
        id: "att_2",
        name: "John Doe",
        email: "john@example.com",
        domain: "example.com",
        company_id: null,
        company_name: null,
        note_count: 1,
        last_note_at: new Date().toISOString(),
      },
    ]);

    vi.mocked(api.assignSpeakerName).mockResolvedValue([]);
  });

  it("renders speaker tags and opens attribution menu when clicked", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TranscriptPanel noteId="m_test_202" />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    // Initial tags are "Them" and "Me"
    const themBtn = await screen.findByRole("button", { name: /Attribute speaker Them/i });
    expect(themBtn).toBeDefined();

    // Press Enter to open dropdown menu
    fireEvent.keyDown(themBtn, { key: "Enter", code: "Enter" });

    // Attendee names should be listed
    const sarahItem = await screen.findByRole("menuitem", { name: /Sarah Connor/i });
    expect(sarahItem).toBeDefined();

    // Select Sarah Connor
    fireEvent.click(sarahItem);

    await waitFor(() => {
      expect(api.assignSpeakerName).toHaveBeenCalledWith("m_test_202", "attendees", "Sarah Connor");
    });
  });
});
