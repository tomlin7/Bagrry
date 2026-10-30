import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectorsTab } from "./ConnectorsTab";
import * as api from "@/lib/api";

const { mockDbStatus, mockApiKeys } = vi.hoisted(() => ({
  mockDbStatus: {
    path: "E:/bagrry.db",
    sqlite_version: "3.45.1",
    groq_configured: true,
    meeting_count: 12,
    api_port: 47821,
    db_size_bytes: 524288,
  },
  mockApiKeys: [],
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    dbStatus: vi.fn().mockResolvedValue(mockDbStatus),
    listApiKeys: vi.fn().mockResolvedValue(mockApiKeys),
    setSecret: vi.fn().mockResolvedValue(undefined),
    createApiKey: vi.fn().mockResolvedValue("bagrry_key_secret_123"),
    revokeApiKey: vi.fn().mockResolvedValue(undefined),
    verifyNotionConnection: vi.fn().mockResolvedValue("Connected to Notion as 'Bagrry Bot'"),
    verifyLinearConnection: vi.fn().mockResolvedValue("Connected to Linear as Dheeraj (Acme)"),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("ConnectorsTab & MCP Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders Model Context Protocol (MCP) section and active port badge", () => {
    renderWithClient(<ConnectorsTab />);

    expect(api.dbStatus).toBeDefined();
    expect(screen.getByText("Model Context Protocol (MCP)")).toBeDefined();
    expect(screen.getByText("Active on port 47821")).toBeDefined();
    expect(screen.getByText("http://127.0.0.1:47821/mcp")).toBeDefined();
    expect(screen.getByText("query_notes")).toBeDefined();
    expect(screen.getByText("get_meeting_transcript")).toBeDefined();
    expect(screen.getByText("list_open_loops")).toBeDefined();
    expect(screen.getByText("get_contact_context")).toBeDefined();
  });

  it("copies Claude Desktop configuration snippet when clicked", async () => {
    renderWithClient(<ConnectorsTab />);

    const copyConfigBtn = screen.getByRole("button", { name: /Copy Config/i });
    fireEvent.click(copyConfigBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("mcpServers"),
      );
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("http://127.0.0.1:47821/mcp"),
      );
    });
  });

  it("copies MCP endpoint URL when clicked", async () => {
    renderWithClient(<ConnectorsTab />);

    const copyUrlBtn = screen.getByRole("button", { name: /Copy URL/i });
    fireEvent.click(copyUrlBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "http://127.0.0.1:47821/mcp",
      );
    });
  });

  it("renders Notion and Linear connector cards and triggers connection verification", async () => {
    renderWithClient(<ConnectorsTab />);

    expect(screen.getByText("Direct Productivity Connectors")).toBeDefined();
    expect(screen.getByText("Notion Workspace")).toBeDefined();
    expect(screen.getByText("Slack Broadcasts")).toBeDefined();
    expect(screen.getByText("Linear Tickets")).toBeDefined();

    const notionInput = screen.getByPlaceholderText(/ntn_\.\.\. or secret_\.\.\./i);
    fireEvent.change(notionInput, { target: { value: "secret_notion_key_123" } });

    const verifyButtons = screen.getAllByRole("button", { name: /Verify Connection/i });
    fireEvent.click(verifyButtons[0]);

    await waitFor(() => {
      expect(api.verifyNotionConnection).toHaveBeenCalledWith("secret_notion_key_123");
    });
  });
});
