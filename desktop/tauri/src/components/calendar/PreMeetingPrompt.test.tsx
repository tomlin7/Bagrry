import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PreMeetingPrompt } from "./PreMeetingPrompt";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";

const { mockCalendarEvents } = vi.hoisted(() => {
  const now = new Date();
  const inOneMin = new Date(now.getTime() + 60_000).toISOString().slice(0, 19).replace("T", " ");
  return {
    mockCalendarEvents: [
      {
        id: "cal_urgent",
        title: "Product Architecture Sync https://meet.google.com/xyz-abcd-qrs",
        start_at: inOneMin,
        end_at: null,
        attendees_json: JSON.stringify([
          { name: "Alex Chen", email: "alex@example.com" },
          { name: "Sarah Lin", email: "sarah@example.com" },
        ]),
      },
    ],
  };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listCalendar: vi.fn().mockResolvedValue(mockCalendarEvents),
    preMeetingBrief: vi.fn().mockResolvedValue("Past decisions: Reviewed Q2 roadmap.\nOpen loops: Follow up on auth refactor with Alex Chen."),
    createMeeting: vi.fn().mockResolvedValue({
      id: "mtg_new",
      title: "Product Architecture Sync https://meet.google.com/xyz-abcd-qrs",
      date: new Date().toISOString(),
      scratchpad_raw: "",
      scratchpad_json: null,
      enhanced_notes_json: null,
      folder_id: null,
    }),
    startRecording: vi.fn().mockResolvedValue({ state: "recording" }),
  };
});

describe("PreMeetingPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ recState: "idle" });
    window.open = vi.fn();
  });

  it("renders pre-meeting prompt when an event is starting soon and handles record action", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PreMeetingPrompt />
      </QueryClientProvider>,
    );

    // Shows Google Meet badge and title
    expect(await screen.findByText("Google Meet")).toBeDefined();
    expect(screen.getByText("Product Architecture Sync https://meet.google.com/xyz-abcd-qrs")).toBeDefined();
    expect(screen.getByText(/Alex Chen, Sarah Lin/i)).toBeDefined();

    // Click "Record with Bagrry"
    const recordBtn = screen.getByRole("button", { name: /Record with Bagrry/i });
    fireEvent.click(recordBtn);

    await waitFor(() => {
      expect(api.createMeeting).toHaveBeenCalledWith(
        "Product Architecture Sync https://meet.google.com/xyz-abcd-qrs",
        null,
      );
      expect(window.open).toHaveBeenCalledWith(
        "https://meet.google.com/xyz-abcd-qrs",
        "_blank",
      );
    });
  });

  it("dismisses prompt when clicking dismiss button", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PreMeetingPrompt />
      </QueryClientProvider>,
    );

    const dismissBtn = await screen.findByRole("button", { name: "Dismiss" });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText("Google Meet")).toBeNull();
  });

  it("expands and loads pre-call attendee briefing and open loops", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PreMeetingPrompt />
      </QueryClientProvider>,
    );

    const catchMeUpBtn = await screen.findByRole("button", { name: /Catch Me Up/i });
    fireEvent.click(catchMeUpBtn);

    expect(await screen.findByText(/Pre-Call Briefing & Open Loops/i)).toBeDefined();
    await waitFor(() => {
      expect(api.preMeetingBrief).toHaveBeenCalled();
      expect(screen.getByText(/Follow up on auth refactor with Alex Chen/i)).toBeDefined();
    });
  });
});
