import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PeerSyncCard } from "./PeerSyncCard";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listLocalPeers: vi.fn(),
    importMeetingBundle: vi.fn(),
  };
});

describe("PeerSyncCard (#67)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders discovered local peers and status", async () => {
    vi.mocked(api.listLocalPeers).mockResolvedValue([
      {
        id: "peer_local_01",
        deviceName: "sarah-thinkpad",
        ipAddress: "192.168.1.189",
        port: 44230,
        lastSeenEpoch: 1000,
        paired: true,
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <PeerSyncCard />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Zero-Cloud Peer Sync & Bundles/i)).toBeDefined();
    expect(await screen.findByText(/sarah-thinkpad/i)).toBeDefined();
    expect(screen.getByText(/192.168.1.189:44230/i)).toBeDefined();
    expect(screen.getByText(/Paired/i)).toBeDefined();
  });

  it("handles importing an encrypted meeting bundle", async () => {
    vi.mocked(api.listLocalPeers).mockResolvedValue([]);
    vi.mocked(api.importMeetingBundle).mockResolvedValue({
      meetingId: "m_imported_99",
      title: "Sprint Planning Export",
      importedSegmentsCount: 15,
      importedActionItemsCount: 3,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PeerSyncCard />
      </QueryClientProvider>
    );

    const input = await screen.findByPlaceholderText(/Path to .bgry bundle file/i);
    act(() => {
      fireEvent.change(input, { target: { value: "C:/bundles/sprint.bgry" } });
    });

    const importBtn = screen.getByRole("button", { name: /Import/i });
    expect(importBtn).not.toBeDisabled();
    act(() => {
      fireEvent.click(importBtn);
    });

    await waitFor(() => {
      expect(api.importMeetingBundle).toHaveBeenCalledWith("C:/bundles/sprint.bgry");
    });
  });
});
