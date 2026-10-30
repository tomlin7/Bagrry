import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingRecordingPill } from "./FloatingRecordingPill";
import { useAppStore } from "@/store/app";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getSetting: vi.fn().mockResolvedValue("1"),
    pauseRecording: vi.fn().mockResolvedValue({
      state: "paused",
      pendingBytes: 1024,
      loopbackOk: true,
      meetingId: "mtg_001",
      lastError: null,
    }),
    stopRecording: vi.fn().mockResolvedValue({
      state: "idle",
      pendingBytes: 2048,
      loopbackOk: true,
      meetingId: "mtg_001",
      lastError: null,
    }),
    transcribePending: vi.fn().mockResolvedValue(undefined),
    enhanceMeeting: vi.fn().mockResolvedValue(undefined),
    discardAudio: vi.fn().mockResolvedValue({
      state: "idle",
      pendingBytes: 0,
      loopbackOk: true,
      meetingId: null,
      lastError: null,
    }),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("FloatingRecordingPill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      recState: "recording",
      recordingMeetingId: "mtg_001",
      recordingStartedAt: Date.now() - 65000,
      vu: { mic: 0.5, system: 0.3 },
    });
  });

  it("renders live REC status, elapsed timer, and finish button", () => {
    renderWithClient(<FloatingRecordingPill />);

    expect(screen.getByText("REC")).toBeDefined();
    expect(screen.getByTitle("Finish and enhance meeting notes with AI synthesis")).toBeDefined();
    expect(screen.getByTitle("Pause recording (Ctrl+Shift+P)")).toBeDefined();
    expect(screen.getByTitle("Discard meeting recording")).toBeDefined();
    expect(screen.getByTitle("Drag pill anywhere")).toBeDefined();
  });

  it("toggles pause and resume when pause button clicked", async () => {
    renderWithClient(<FloatingRecordingPill />);

    const pauseBtn = screen.getByTitle("Pause recording (Ctrl+Shift+P)");
    fireEvent.click(pauseBtn);

    await waitFor(() => {
      expect(api.pauseRecording).toHaveBeenCalled();
    });
  });

  it("finishes and triggers transcription and AI enhancement", async () => {
    renderWithClient(<FloatingRecordingPill />);

    const finishBtn = screen.getByTitle("Finish and enhance meeting notes with AI synthesis");
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(api.stopRecording).toHaveBeenCalled();
      expect(api.transcribePending).toHaveBeenCalledWith("mtg_001");
      expect(api.enhanceMeeting).toHaveBeenCalledWith("mtg_001");
    });
  });

  it("opens discard confirmation modal and discards recording", async () => {
    renderWithClient(<FloatingRecordingPill />);

    const discardBtn = screen.getByTitle("Discard meeting recording");
    fireEvent.click(discardBtn);

    await waitFor(() => {
      expect(screen.getByText("Discard Recording Session?")).toBeDefined();
    });

    const confirmDiscardBtn = screen.getByRole("button", { name: "Discard Audio" });
    fireEvent.click(confirmDiscardBtn);

    await waitFor(() => {
      expect(api.stopRecording).toHaveBeenCalled();
      expect(api.discardAudio).toHaveBeenCalled();
    });
  });
});
