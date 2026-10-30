import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExportDialog } from "./ExportDialog";
import * as api from "@/lib/api";

const { mockFormattedExport } = vi.hoisted(() => ({
  mockFormattedExport: {
    format: "slack",
    content: "*Product Architecture Review*\n• Key decisions\n• Next actions",
    filename: "Product_Architecture_Review.txt",
    mime_type: "text/plain",
  },
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    exportFormatted: vi.fn().mockResolvedValue(mockFormattedExport),
    exportToNotion: vi.fn().mockResolvedValue("https://notion.so/test-page-123"),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("ExportDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.exportFormatted).mockResolvedValue(mockFormattedExport);

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    Object.assign(window.URL, {
      createObjectURL: vi.fn().mockReturnValue("blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });

    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("renders export format options", () => {
    renderWithClient(
      <ExportDialog
        meetingId="mtg_001"
        meetingTitle="Product Architecture Review"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText("Export Note")).toBeDefined();
    expect(screen.getByText("Copy as Slack Markdown")).toBeDefined();
    expect(screen.getByText("Copy as Notion / Rich Text")).toBeDefined();
    expect(screen.getByText("Download Markdown (.md)")).toBeDefined();
    expect(screen.getByText("Export Styled PDF / Print")).toBeDefined();
  });

  it("exports slack markdown when clicked", async () => {
    renderWithClient(
      <ExportDialog
        meetingId="mtg_001"
        meetingTitle="Product Architecture Review"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    const slackOption = screen.getByText("Copy as Slack Markdown");
    fireEvent.click(slackOption);

    await waitFor(() => {
      expect(api.exportFormatted).toHaveBeenCalledWith("mtg_001", "slack");
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        mockFormattedExport.content,
      );
    });
  });

  it("downloads markdown file when option clicked", async () => {
    renderWithClient(
      <ExportDialog
        meetingId="mtg_001"
        meetingTitle="Product Architecture Review"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    const downloadOption = screen.getByText("Download Markdown (.md)");
    fireEvent.click(downloadOption);

    await waitFor(() => {
      expect(api.exportFormatted).toHaveBeenCalledWith("mtg_001", "markdown");
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("exports note directly to Notion when clicking Notion button", async () => {
    vi.mocked(api.exportToNotion).mockResolvedValue("https://notion.so/test-page-123");
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderWithClient(
      <ExportDialog
        meetingId="mtg_001"
        meetingTitle="Product Architecture Review"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    const notionBtn = screen.getByText("Push to Notion Workspace");
    fireEvent.click(notionBtn);

    await waitFor(() => {
      expect(api.exportToNotion).toHaveBeenCalledWith("mtg_001");
      expect(openSpy).toHaveBeenCalledWith("https://notion.so/test-page-123", "_blank");
    });
  });
});
