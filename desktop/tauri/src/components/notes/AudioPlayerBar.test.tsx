import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { AudioPlayerBar } from "./AudioPlayerBar";
import { useAudioPlayerStore } from "@/store/audio";
import type { TranscriptSeg } from "@/lib/types";

const mockSegments: TranscriptSeg[] = [
  {
    id: "seg_1",
    speaker: "me",
    start_ms: 10000,
    end_ms: 20000,
    text: "Reviewing milestone priorities.",
    sentence_index: 0,
    sentence_id: "s_001",
  },
];

describe("AudioPlayerBar", () => {
  beforeEach(() => {
    useAudioPlayerStore.getState().close();
  });

  it("renders when audio is active and supports playback controls", () => {
    // Start audio player
    useAudioPlayerStore.getState().playFrom("mtg_123", 12000, "s_001", 60000);

    render(
      <TooltipProvider>
        <AudioPlayerBar meetingId="mtg_123" segments={mockSegments} />
      </TooltipProvider>,
    );

    // Shows current time and total time
    expect(screen.getByText("00:12")).toBeDefined();
    expect(screen.getByText("01:00")).toBeDefined();

    // Active speech quote preview
    expect(screen.getByText("“Reviewing milestone priorities.”")).toBeDefined();
    expect(screen.getByText("Me")).toBeDefined();

    // Toggle pause
    const pauseBtn = screen.getByRole("button", { name: /Pause audio/i });
    fireEvent.click(pauseBtn);
    expect(useAudioPlayerStore.getState().isPlaying).toBe(false);

    // Skip forward 5s
    const skipFwdBtn = screen.getByRole("button", { name: /Skip forward 5 seconds/i });
    fireEvent.click(skipFwdBtn);
    expect(useAudioPlayerStore.getState().currentTimeMs).toBe(17000);

    // Skip backward 5s
    const skipBackBtn = screen.getByRole("button", { name: /Skip back 5 seconds/i });
    fireEvent.click(skipBackBtn);
    expect(useAudioPlayerStore.getState().currentTimeMs).toBe(12000);

    // Change speed to 1.5x
    const speed15Btn = screen.getByRole("button", { name: "1.5x" });
    fireEvent.click(speed15Btn);
    expect(useAudioPlayerStore.getState().playbackRate).toBe(1.5);
  });
});
