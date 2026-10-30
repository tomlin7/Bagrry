import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ActionItemsPage } from "./ActionItemsPage";
import * as api from "@/lib/api";

const { mockActionItems } = vi.hoisted(() => ({
  mockActionItems: [
    {
      id: "act_1",
      meeting_id: "mtg_1",
      meeting_title: "Northwind pricing review",
      owner: "me",
      task: "Send updated contract and DPA",
      deadline: "2026-11-05T00:00:00Z",
      done: false,
    },
    {
      id: "act_2",
      meeting_id: "mtg_1",
      meeting_title: "Northwind pricing review",
      owner: "Alex Chen",
      task: "Review true-up seat count with legal",
      deadline: "2026-11-08T00:00:00Z",
      done: false,
    },
    {
      id: "act_3",
      meeting_id: "mtg_2",
      meeting_title: "Sprint Planning",
      owner: "me",
      task: "Merge database migration PR",
      deadline: null,
      done: true,
    },
  ],
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listActionItems: vi.fn().mockResolvedValue(mockActionItems),
    listMeetings: vi.fn().mockResolvedValue([
      { id: "mtg_1", title: "Northwind pricing review" },
      { id: "mtg_2", title: "Sprint Planning" },
    ]),
    setActionItemDone: vi.fn().mockResolvedValue(undefined),
    addActionItem: vi.fn().mockResolvedValue({
      id: "act_new",
      meeting_id: "mtg_1",
      meeting_title: "Northwind pricing review",
      owner: "me",
      task: "Follow up with finance team",
      deadline: null,
      done: false,
    }),
    deleteActionItem: vi.fn().mockResolvedValue(undefined),
    listMeetingAttendees: vi.fn().mockResolvedValue([]),
  };
});

describe("ActionItemsPage & Open Loops Inbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders open loops categorized by owed-by-me and owed-to-me", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <ActionItemsPage />
        </QueryClientProvider>
      </TooltipProvider>,
    );

    // Header and pending tasks
    expect(await screen.findByText("Open Loops")).toBeDefined();
    expect(await screen.findByText("Send updated contract and DPA")).toBeDefined();
    expect(screen.getByText("Review true-up seat count with legal")).toBeDefined();

    // Verify filter tabs exist
    expect(screen.getByText("Owed by Me")).toBeDefined();
    expect(screen.getByText("Owed to Me")).toBeDefined();
    expect(screen.getByText("Completed")).toBeDefined();

    // Switch to Owed to Me tab (should only show Alex Chen's task)
    fireEvent.click(screen.getByText("Owed to Me"));
    expect(screen.getByText("Review true-up seat count with legal")).toBeDefined();
    expect(screen.queryByText("Send updated contract and DPA")).toBeNull();

    // Switch to Completed tab
    fireEvent.click(screen.getByText("Completed"));
    expect(screen.getByText("Merge database migration PR")).toBeDefined();
  });

  it("marks action item as done when clicking completion checkbox", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <ActionItemsPage />
        </QueryClientProvider>
      </TooltipProvider>,
    );

    const markDoneBtn = (await screen.findAllByRole("button", { name: "Mark done" }))[0];
    fireEvent.click(markDoneBtn);

    await waitFor(() => {
      expect(api.setActionItemDone).toHaveBeenCalledWith("act_1", true);
    });
  });

  it("captures new commitment from the quick add bar", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <ActionItemsPage />
        </QueryClientProvider>
      </TooltipProvider>,
    );

    const input = screen.getByPlaceholderText(/Capture new commitment/i);
    fireEvent.change(input, { target: { value: "Follow up with finance team" } });

    const addBtn = screen.getByRole("button", { name: "Add Loop" });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(api.addActionItem).toHaveBeenCalledWith(
        expect.any(String),
        "Follow up with finance team",
        "me",
        null,
      );
    });
  });
});
