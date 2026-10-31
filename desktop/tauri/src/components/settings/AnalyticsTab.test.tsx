import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsTab } from "./AnalyticsTab";

const { mockAnalytics } = vi.hoisted(() => ({
  mockAnalytics: {
    total_meetings: 24,
    total_minutes: 600,
    this_week_minutes: 180,
    last_week_minutes: 120,
    talk_time_me_pct: 42,
    talk_time_others_pct: 58,
    open_commitments: 3,
    completed_commitments: 9,
    top_collaborators: [
      {
        name: "Alex Chen",
        role: "VP Engineering",
        company: "Northwind",
        meeting_count: 8,
      },
      {
        name: "Sarah Lin",
        role: "Head of Product",
        company: "Acme",
        meeting_count: 6,
      },
    ],
    day_breakdown: [
      { day: "Mon", minutes: 45 },
      { day: "Tue", minutes: 60 },
      { day: "Wed", minutes: 30 },
      { day: "Thu", minutes: 45 },
      { day: "Fri", minutes: 0 },
      { day: "Sat", minutes: 0 },
      { day: "Sun", minutes: 0 },
    ],
  },
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getMeetingAnalytics: vi.fn().mockResolvedValue(mockAnalytics),
  };
});

describe("AnalyticsTab (#49)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders workspace analytics dashboard with meeting habits and metrics", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsTab />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Workspace Analytics")).toBeDefined();
    expect(await screen.findByText("10.0h")).toBeDefined();
    expect(screen.getByText(/24 meetings/i)).toBeDefined();
    expect(screen.getByText("3.0h")).toBeDefined();
    expect(screen.getByText("+1.0h vs last week")).toBeDefined();
  });

  it("renders talk-time ratio insights and collaborative balance assessment", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsTab />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Talk-Time Ratio \(Me vs Attendees\)/i)).toBeDefined();
    expect(await screen.findByText(/Me \(Microphone\): 42%/i)).toBeDefined();
    expect(screen.getByText(/Attendees \(System\): 58%/i)).toBeDefined();
    expect(screen.getByText(/Balanced collaborative participation/i)).toBeDefined();
  });

  it("renders weekly cadence breakdown and top collaborator rankings", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AnalyticsTab />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Weekly Meeting Cadence")).toBeDefined();
    expect(await screen.findByText("Mon")).toBeDefined();
    expect(screen.getByText("Tue")).toBeDefined();

    expect(screen.getByText("Top Collaborators")).toBeDefined();
    expect(screen.getByText("Alex Chen")).toBeDefined();
    expect(screen.getByText("VP Engineering")).toBeDefined();
    expect(screen.getByText("8 meetings")).toBeDefined();
    expect(screen.getByText("Sarah Lin")).toBeDefined();
    expect(screen.getByText("6 meetings")).toBeDefined();
  });
});