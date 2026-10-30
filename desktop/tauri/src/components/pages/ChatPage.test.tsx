import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatPage, AssistantMessage, parseAssistantContent } from "./ChatPage";
import { useAppStore } from "@/store/app";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getProfile: vi.fn(),
    listChatSessions: vi.fn(),
    listChatMessages: vi.fn(),
    deleteChatSession: vi.fn(),
    createChatSession: vi.fn(),
    appendChatMessage: vi.fn(),
    askBagrry: vi.fn(),
  };
});

describe("ChatPage & Cross-Meeting Intelligence (#42)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(api.getProfile).mockResolvedValue({
      name: "Alex Vance",
      email: "alex@example.com",
      workspace: "Acme Corp",
    });

    vi.mocked(api.listChatSessions).mockResolvedValue([
      {
        id: "sess_001",
        title: "Q3 Planning Follow-up",
        space_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  });

  it("parses confidence rating and citation tokens accurately", () => {
    const raw =
      "Across your meetings, Sarah confirmed the launch date.\n\n[[meeting:m_101:Product Strategy Kickoff]] agreed on Oct 15.\n\n[Confidence: High (96%) · Grounded across 2 meetings]";

    const result = parseAssistantContent(raw);
    expect(result.confidenceText).toBe("High (96%) · Grounded across 2 meetings");
    expect(result.citedMeetings).toEqual([
      { id: "m_101", title: "Product Strategy Kickoff" },
    ]);
    expect(result.contentWithoutConf).toContain("Sarah confirmed the launch date");
  });

  it("renders AssistantMessage with confidence badge, inline citation pills, and sources tray", async () => {
    const navigateSpy = vi.fn();
    useAppStore.setState({ navigate: navigateSpy });

    const messageContent =
      "Pricing review concluded.\n\nAccording to [[meeting:m_202:Enterprise Pricing Review]], the base fee is $40/seat.\nAlso discussed in [[meeting:m_303:Q3 Exec Review]].\n\n[Confidence: High (94%) · Grounded across 2 meetings]";

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AssistantMessage content={messageContent} />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    // Verify confidence badge
    expect(screen.getByText(/Confidence: High \(94%\) · Grounded across 2 meetings/i)).toBeDefined();

    // Verify inline citation buttons
    const inlinePills = screen.getAllByRole("button", { name: /Enterprise Pricing Review/i });
    expect(inlinePills.length).toBeGreaterThanOrEqual(1);

    // Verify referenced sources footnote tray
    expect(screen.getByText(/Referenced Sources \(2\)/i)).toBeDefined();
    const q3Buttons = screen.getAllByRole("button", { name: /Q3 Exec Review/i });
    expect(q3Buttons.length).toBeGreaterThanOrEqual(2);

    // Clicking a citation pill triggers navigation to that meeting note
    fireEvent.click(inlinePills[0]);
    expect(navigateSpy).toHaveBeenCalledWith({ kind: "note", noteId: "m_202" });
  });

  it("renders ChatLanding with greeting and cross-meeting prompt starters", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ChatPage sessionId={null} />
        </TooltipProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Hi Alex, ask anything/i)).toBeDefined();
    expect(screen.getByText(/Cross-Meeting Intelligence/i)).toBeDefined();
    expect(
      screen.getByText(/Summarize key decisions made across all meetings this week/i),
    ).toBeDefined();
    expect(await screen.findByText("Q3 Planning Follow-up")).toBeDefined();
  });
});
