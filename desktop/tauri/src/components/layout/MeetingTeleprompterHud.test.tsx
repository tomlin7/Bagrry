import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MeetingTeleprompterHud } from "./MeetingTeleprompterHud";
import { useAppStore } from "@/store/app";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getMeeting: vi.fn(),
    liveAsk: vi.fn(),
    saveScratchpad: vi.fn(),
    pauseRecording: vi.fn(),
    stopRecording: vi.fn(),
  };
});

describe("MeetingTeleprompterHud (#44)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    useAppStore.setState({
      recState: "recording",
      recordingStartedAt: Date.now() - 60000,
      recordingMeetingId: "m_test_101",
      liveSegments: [
        {
          id: "seg_1",
          meeting_id: "m_test_101",
          speaker: "attendees",
          start_ms: 12000,
          end_ms: 18000,
          text: "Let's review the product launch dates.",
          sentence_index: 0,
          sentence_id: "s_001",
        },
      ],
    });

    vi.mocked(api.getMeeting).mockResolvedValue({
      id: "m_test_101",
      folder_id: null,
      title: "Sprint Sync & Launch Planning",
      date: new Date().toISOString(),
      duration_ms: 60000,
      calendar_event_id: null,
      scratchpad_raw: "- Agenda: Q3 launch",
      scratchpad_json: null,
      enhanced_notes_json: null,
      transcript_json: null,
      updated_at: new Date().toISOString(),
    });

    vi.mocked(api.liveAsk).mockResolvedValue("The attendees agreed to review launch dates on Friday.");
  });

  it("renders HUD with title, live segments, and tab controls", async () => {
    const closeSpy = vi.fn();
    const minSpy = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <MeetingTeleprompterHud open={true} onClose={closeSpy} onMinimizeToPill={minSpy} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Sprint Sync & Launch Planning/i)).toBeDefined();
    expect(screen.getByText(/REC/i)).toBeDefined();
    expect(screen.getByText(/Let's review the product launch dates/i)).toBeDefined();
    expect(screen.getByText(/Attendees/i)).toBeDefined();
  });

  it("switches to Talking Points tab and edits notes", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MeetingTeleprompterHud open={true} onClose={vi.fn()} onMinimizeToPill={vi.fn()} />
      </QueryClientProvider>,
    );

    // Switch to Talking Points tab
    const notesTab = screen.getByRole("button", { name: /Talking Points/i });
    fireEvent.click(notesTab);

    const textarea = screen.getByPlaceholderText(/Type rapid talking points/i) as HTMLTextAreaElement;
    expect(textarea).toBeDefined();

    fireEvent.change(textarea, { target: { value: "- Finalize launch marketing plan" } });
    expect(textarea.value).toBe("- Finalize launch marketing plan");
    expect(api.saveScratchpad).toHaveBeenCalledWith("m_test_101", "- Finalize launch marketing plan", null);
  });

  it("submits question in Copilot tab and displays synthesized answer", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MeetingTeleprompterHud open={true} onClose={vi.fn()} onMinimizeToPill={vi.fn()} />
      </QueryClientProvider>,
    );

    // Switch to Copilot tab
    const copilotTab = screen.getByRole("button", { name: /Copilot Q&A/i });
    fireEvent.click(copilotTab);

    const input = screen.getByPlaceholderText(/Ask about this call…/i);
    fireEvent.change(input, { target: { value: "When is the launch?" } });

    const submitBtn = screen.getByRole("button", { name: "" });
    fireEvent.submit(input.closest("form")!);

    expect(await screen.findByText(/The attendees agreed to review launch dates on Friday/i)).toBeDefined();
  });
});
