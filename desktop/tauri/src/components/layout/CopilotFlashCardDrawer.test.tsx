import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CopilotFlashCardDrawer } from "./CopilotFlashCardDrawer";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof api>();
  return {
    ...actual,
    listCopilotFlashCards: vi.fn(),
    createCopilotFlashCard: vi.fn(),
    dismissCopilotFlashCard: vi.fn(),
  };
});

describe("CopilotFlashCardDrawer (#69)", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it("renders idle copilot listening state when no cards exist", async () => {
    vi.mocked(api.listCopilotFlashCards).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <CopilotFlashCardDrawer meetingId="meet_test_1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Listening for ticket numbers/i)).toBeDefined();
    expect(screen.getByText(/\+ Simulate Trigger/i)).toBeDefined();
  });

  it("renders active flash cards with quote to notes action", async () => {
    vi.mocked(api.listCopilotFlashCards).mockResolvedValue([
      {
        id: "fc_1",
        meeting_id: "meet_test_1",
        trigger_text: "ENG-402",
        source_type: "linear",
        title: "Linear ENG-402 · Fix Stripe Webhook Signature Check",
        snippet: "Status: Merged to main on Nov 2nd.",
        url: "https://linear.app/issue/ENG-402",
        created_at: "2026-11-10T12:00:00Z",
      },
    ]);

    const onQuote = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <CopilotFlashCardDrawer meetingId="meet_test_1" onQuoteToNotes={onQuote} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Proactive Flash Cards \(1\)/i)).toBeDefined();
    expect(screen.getByText(/Linear ENG-402/i)).toBeDefined();
    expect(screen.getByText(/Merged to main on Nov 2nd/i)).toBeDefined();

    const quoteBtn = screen.getByText("Quote to Note");
    fireEvent.click(quoteBtn);
    expect(onQuote).toHaveBeenCalledWith(expect.stringContaining("Linear ENG-402"));
  });
});
