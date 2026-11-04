import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MeetingTeleprompterHud } from "./MeetingTeleprompterHud";
import { useAppStore } from "@/store/app";
import * as api from "@/lib/api";
import type { SubtitleEvent } from "@/lib/types";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getMeeting: vi.fn(),
    liveAsk: vi.fn(),
    saveScratchpad: vi.fn(),
    pauseRecording: vi.fn(),
    stopRecording: vi.fn(),
    onVoiceCommand: vi.fn().mockResolvedValue(() => {}),
    getSupportedLanguages: vi.fn().mockResolvedValue([
      { code: "off", name: "Disabled", nativeName: "Original" },
      { code: "es", name: "Spanish", nativeName: "Español" },
    ]),
    getActiveTranslationLanguage: vi.fn().mockResolvedValue("es"),
    setActiveTranslationLanguage: vi.fn().mockResolvedValue(undefined),
    onSubtitle: vi.fn().mockResolvedValue(() => {}),
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

    fireEvent.submit(input.closest("form")!);

    expect(await screen.findByText(/The attendees agreed to review launch dates on Friday/i)).toBeDefined();
  });

  it("surfaces in-meeting voice command indicator when Hey Bagrry is detected", async () => {
    let capturedCallback: ((payload: { command_type: string; payload: string }) => void) | null = null;
    vi.mocked(api.onVoiceCommand).mockImplementation((cb) => {
      capturedCallback = cb;
      return Promise.resolve(() => {});
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MeetingTeleprompterHud open={true} onClose={vi.fn()} onMinimizeToPill={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(capturedCallback).not.toBeNull();
    act(() => {
      capturedCallback!({
        command_type: "action",
        payload: "Follow up with Sarah regarding API documentation",
      });
    });

    expect(await screen.findByText(/Hey Bagrry:/i)).toBeDefined();
    expect(screen.getByText(/Follow up with Sarah regarding API documentation/i)).toBeDefined();
  });

  it("renders live subtitle language selector and real-time translated subtitles (#64)", async () => {
    let capturedSubtitleCb: ((event: SubtitleEvent) => void) | null = null;
    vi.mocked(api.onSubtitle).mockImplementation((cb) => {
      capturedSubtitleCb = cb;
      return Promise.resolve(() => {});
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MeetingTeleprompterHud open={true} onClose={vi.fn()} onMinimizeToPill={vi.fn()} />
      </QueryClientProvider>,
    );

    const select = await screen.findByLabelText(/Live translation language/i);
    expect(select).toBeDefined();
    await screen.findByRole("option", { name: /Spanish/i });

    fireEvent.change(select, { target: { value: "es" } });
    await waitFor(() => {
      expect(api.setActiveTranslationLanguage).toHaveBeenCalledWith("es");
    });

    expect(capturedSubtitleCb).not.toBeNull();
    act(() => {
      capturedSubtitleCb!({
        meetingId: "m_test_101",
        sourceText: "We need to finalize the roadmap.",
        targetLang: "es",
        translatedText: "Necesitamos finalizar la hoja de ruta.",
        speaker: "attendees",
        timestampMs: 14000,
      });
    });

    expect(await screen.findByText(/Necesitamos finalizar la hoja de ruta/i)).toBeDefined();
    expect(screen.getByText(/\[es\]:/i)).toBeDefined();
  });
});
