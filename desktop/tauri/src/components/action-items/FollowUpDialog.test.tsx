import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FollowUpDialog } from "./FollowUpDialog";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listMeetings: vi.fn().mockResolvedValue([
      { id: "mtg_pricing", title: "Northwind pricing review" },
    ]),
    listMeetingAttendees: vi.fn().mockResolvedValue([
      { id: "p_alex", name: "Alex Chen", email: "alex@northwind.example" },
    ]),
    listActionItems: vi.fn().mockResolvedValue([
      {
        id: "act_1",
        meeting_id: "mtg_pricing",
        meeting_title: "Northwind pricing review",
        owner: "me",
        task: "Send revised MSA agreement",
        deadline: "2026-11-05T00:00:00Z",
        done: false,
      },
      {
        id: "act_2",
        meeting_id: "mtg_pricing",
        meeting_title: "Northwind pricing review",
        owner: "Alex Chen",
        task: "Approve quarterly tier budget",
        deadline: null,
        done: false,
      },
    ]),
  };
});

describe("FollowUpDialog", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("generates structured follow-up recap email and Slack messages", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FollowUpDialog open={true} onOpenChange={vi.fn()} meetingId="mtg_pricing" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("1-Click Follow-Up Generator")).toBeDefined();

    // Verify email subject and commitments included in textarea
    const textarea = (await screen.findByRole("textbox")) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Thanks for your time today during "Northwind pricing review"');
    expect(textarea.value).toContain("Send revised MSA agreement");
    expect(textarea.value).toContain("Alex Chen: Approve quarterly tier budget");

    // Switch to Slack message format
    fireEvent.click(screen.getByText("Slack Message"));
    expect(textarea.value).toContain("*Meeting Recap: Northwind pricing review*");
    expect(textarea.value).toContain("*@Alex Chen*: Approve quarterly tier budget");

    // Switch to Linear format
    fireEvent.click(screen.getByText("Linear / GitHub"));
    expect(textarea.value).toContain("- [ ] Send revised MSA agreement @me");
    expect(textarea.value).toContain("- [ ] Approve quarterly tier budget @Alex Chen");

    // Copy to clipboard
    const copyBtn = screen.getByRole("button", { name: /Copy to Clipboard/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("- [ ] Send revised MSA agreement"),
      );
    });
  });
});
