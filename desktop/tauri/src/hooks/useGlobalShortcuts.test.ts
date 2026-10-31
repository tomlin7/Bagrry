import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGlobalShortcuts } from "./useGlobalShortcuts";
import { useAppStore } from "@/store/app";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    startRecording: vi.fn().mockResolvedValue({ state: "recording" }),
    stopRecording: vi.fn().mockResolvedValue({ state: "idle" }),
    pauseRecording: vi.fn().mockResolvedValue({ state: "paused" }),
  };
});

describe("useGlobalShortcuts (#46)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      paletteOpen: false,
      sidebarOpen: true,
      recState: "idle",
      recordingMeetingId: "note_123",
    });
  });

  it("handles Ctrl+K to toggle command palette", () => {
    renderHook(() => useGlobalShortcuts());

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );

    expect(useAppStore.getState().paletteOpen).toBe(true);
  });

  it("handles Ctrl+\\ to toggle sidebar", () => {
    renderHook(() => useGlobalShortcuts());

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "\\", ctrlKey: true, bubbles: true }),
    );

    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it("handles Ctrl+Shift+R to start and stop recording", async () => {
    renderHook(() => useGlobalShortcuts());

    // Start recording
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "R", ctrlKey: true, shiftKey: true, bubbles: true }),
    );
    expect(api.startRecording).toHaveBeenCalledWith("note_123");

    // When recording, press Ctrl+Shift+R to stop
    useAppStore.setState({ recState: "recording" });
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "r", ctrlKey: true, shiftKey: true, bubbles: true }),
    );
    expect(api.stopRecording).toHaveBeenCalled();
  });

  it("handles Ctrl+Shift+P to pause active recording", () => {
    renderHook(() => useGlobalShortcuts());

    useAppStore.setState({ recState: "recording" });
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "P", ctrlKey: true, shiftKey: true, bubbles: true }),
    );

    expect(api.pauseRecording).toHaveBeenCalled();
  });
});
