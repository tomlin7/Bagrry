import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VisualTimelineStrip } from "./VisualTimelineStrip";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof api>();
  return {
    ...actual,
    listVisualFrames: vi.fn(),
    saveVisualFrame: vi.fn(),
    deleteVisualFrame: vi.fn(),
  };
});

describe("VisualTimelineStrip (#68)", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it("renders empty state and allows capturing a slide snapshot", async () => {
    vi.mocked(api.listVisualFrames).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <VisualTimelineStrip meetingId="meet_test_1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Screen & Slide Ingestion \(0\)/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Capture Slide Snapshot/i })).toBeDefined();
    expect(screen.getByText(/No presentation slides captured yet/i)).toBeDefined();
  });

  it("renders captured slide frames and displays OCR details on click", async () => {
    vi.mocked(api.listVisualFrames).mockResolvedValue([
      {
        id: "vf_1",
        meeting_id: "meet_test_1",
        timestamp_ms: 120000,
        ocr_text: "System Architecture Overview: SQLite + Vectors",
        slide_title: "Slide 1: High Level Arch",
        thumbnail_path: null,
        created_at: "2026-11-10T12:00:00Z",
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <VisualTimelineStrip meetingId="meet_test_1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Slide 1: High Level Arch")).toBeDefined();
    expect(screen.getByText(/SQLite \+ Vectors/)).toBeDefined();

    // Click to open slide modal
    fireEvent.click(screen.getByText("Slide 1: High Level Arch"));
    expect(await screen.findByText("Extracted OCR Text")).toBeDefined();
    expect(screen.getByText("Copy OCR")).toBeDefined();
  });
});
