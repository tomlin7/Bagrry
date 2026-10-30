import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShareDialog } from "./ShareDialog";
import * as api from "@/lib/api";

const { mockShares, mockCreatedShare } = vi.hoisted(() => ({
  mockShares: [
    {
      token: "tok_abc123",
      meeting_id: "mtg_001",
      include_transcript: true,
      include_audio: false,
      include_scratchpad: true,
      expires_at: null,
      revoked: false,
      views_count: 5,
      created_at: "2026-10-30 10:00:00",
      url: "http://127.0.0.1:4545/s/tok_abc123",
    },
  ],
  mockCreatedShare: {
    token: "tok_new999",
    meeting_id: "mtg_001",
    include_transcript: false,
    include_audio: false,
    include_scratchpad: true,
    expires_at: null,
    revoked: false,
    views_count: 0,
    created_at: "2026-10-31 00:00:00",
    url: "http://127.0.0.1:4545/s/tok_new999",
  },
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getMeetingShares: vi.fn().mockResolvedValue(mockShares),
    createShareCustom: vi.fn().mockResolvedValue(mockCreatedShare),
    revokeShare: vi.fn().mockResolvedValue(undefined),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("ShareDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getMeetingShares).mockResolvedValue(mockShares);
    vi.mocked(api.createShareCustom).mockResolvedValue(mockCreatedShare);
    vi.mocked(api.revokeShare).mockResolvedValue(undefined);

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    window.confirm = vi.fn().mockReturnValue(true);
  });

  it("renders active share url and copy button", async () => {
    renderWithClient(
      <ShareDialog
        meetingId="mtg_001"
        meetingTitle="Product Architecture Review"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Share Note")).toBeDefined();
      expect(screen.getByDisplayValue("http://127.0.0.1:4545/s/tok_abc123")).toBeDefined();
      expect(screen.getAllByText(/5 views/i).length).toBeGreaterThanOrEqual(1);
    });

    // Copy link
    const copyBtn = screen.getByRole("button", { name: /Copy Link/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("http://127.0.0.1:4545/s/tok_abc123");
  });

  it("allows customizing privacy toggles and generating new link", async () => {
    renderWithClient(
      <ShareDialog
        meetingId="mtg_001"
        meetingTitle="Product Architecture Review"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Privacy & Content Controls")).toBeDefined();
    });

    // Toggle include verbatim transcript
    const transcriptCheckbox = screen.getByLabelText(/Include Verbatim Transcript/i);
    fireEvent.click(transcriptCheckbox);

    // Generate link
    const generateBtn = screen.getByRole("button", { name: /Generate New Secret Link/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(api.createShareCustom).toHaveBeenCalledWith({
        meetingId: "mtg_001",
        includeTranscript: false,
        includeAudio: false,
        includeScratchpad: true,
        expiresDays: null,
      });
    });
  });

  it("allows revoking a generated share link", async () => {
    renderWithClient(
      <ShareDialog
        meetingId="mtg_001"
        meetingTitle="Product Architecture Review"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTitle("Revoke access")).toBeDefined();
    });

    const revokeBtn = screen.getByTitle("Revoke access");
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(api.revokeShare).toHaveBeenCalledWith("tok_abc123");
    });
  });
});
