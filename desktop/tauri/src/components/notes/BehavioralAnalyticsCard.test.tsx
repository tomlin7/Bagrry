import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BehavioralAnalyticsCard } from "./BehavioralAnalyticsCard";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof api>();
  return {
    ...actual,
    getBehavioralAnalytics: vi.fn(),
  };
});

describe("BehavioralAnalyticsCard (#72)", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it("renders talk-to-listen ratios, monologues, and sentiment timeline", async () => {
    vi.mocked(api.getBehavioralAnalytics).mockResolvedValue({
      meeting_id: "meet_1",
      talk_ratios: [
        { speaker: "You", duration_ms: 60000, percentage: 65 },
        { speaker: "Attendees", duration_ms: 32000, percentage: 35 },
      ],
      longest_monologue_ms: 45000,
      longest_monologue_speaker: "You",
      interruption_count: 8,
      sentiment_timeline: [
        {
          timestamp_ms: 12000,
          speaker: "Attendee",
          sentiment: "positive",
          score: 0.85,
          text: "We love the new design direction!",
        },
        {
          timestamp_ms: 25000,
          speaker: "You",
          sentiment: "skeptical",
          score: -0.7,
          text: "We have some latency concerns on that endpoint.",
        },
      ],
      overall_engagement_score: 91,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BehavioralAnalyticsCard meetingId="meet_1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Speaker Dynamics & Behavioral Intelligence")).toBeDefined();
    expect(screen.getByText("91% Score")).toBeDefined();
    expect(screen.getByText("65%")).toBeDefined();
    expect(screen.getByText("35%")).toBeDefined();
    expect(screen.getByText("8 speaker transitions")).toBeDefined();
    expect(screen.getByText(/We love the new design direction!/)).toBeDefined();
  });
});
