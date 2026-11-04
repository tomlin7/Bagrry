import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DispatchFollowUpDialog } from "./DispatchFollowUpDialog";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getDispatchHistory: vi.fn(),
    dispatchMeeting: vi.fn(),
  };
});

describe("DispatchFollowUpDialog (#65)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders destination options and triggers multi-channel dispatch", async () => {
    vi.mocked(api.getDispatchHistory).mockResolvedValue([]);
    vi.mocked(api.dispatchMeeting).mockResolvedValue({
      meetingId: "m_test_101",
      results: [
        {
          destination: "linear",
          status: "success",
          message: "Synchronized 2 action items",
          referenceUrl: "https://linear.app",
        },
        {
          destination: "notion",
          status: "success",
          message: "Exported page to Notion database",
          referenceUrl: "https://notion.so",
        },
      ],
      timestamp: "Epoch 100",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DispatchFollowUpDialog
          open={true}
          onClose={vi.fn()}
          meetingId="m_test_101"
          meetingTitle="Q3 Roadmap Review"
        />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Multi-Channel Meeting Dispatch/i)).toBeDefined();
    expect(screen.getByText(/Linear Issues/i)).toBeDefined();
    expect(screen.getByText(/Notion Database/i)).toBeDefined();
    expect(screen.getByText(/Slack Webhook/i)).toBeDefined();

    const dispatchBtn = screen.getByRole("button", { name: /Dispatch Follow-Up/i });
    fireEvent.click(dispatchBtn);

    expect(await screen.findByText(/Dispatch Summary:/i)).toBeDefined();
    expect(screen.getByText(/Synchronized 2 action items/i)).toBeDefined();
    expect(screen.getByText(/Exported page to Notion database/i)).toBeDefined();
  });
});
