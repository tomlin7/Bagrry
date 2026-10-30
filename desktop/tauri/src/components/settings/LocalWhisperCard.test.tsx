import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocalWhisperCard } from "./LocalWhisperCard";
import * as api from "@/lib/api";
import type { LocalSttStatus } from "@/lib/types";

const { mockSttStatus } = vi.hoisted(() => ({
  mockSttStatus: {
    engine: "local" as const,
    activeModel: "base",
    avx2Supported: true,
    cpuThreads: 16,
    gpuAvailable: true,
    cloudFallback: true,
    models: [
      {
        id: "tiny",
        name: "Whisper Tiny (Quantized)",
        sizeMb: 75,
        downloaded: false,
        active: false,
        sha256: "e4a8b79b5c7e12613b455b5d848773c52a512c12a781b0a5",
        speedFactor: "8.5x realtime",
        description: "Ultra-fast transcription with minimal CPU & memory usage (~75 MB)",
      },
      {
        id: "base",
        name: "Whisper Base (Recommended)",
        sizeMb: 140,
        downloaded: true,
        active: true,
        sha256: "60ed5bc3dd14e0130488d49179943520bed509b3ecc90207",
        speedFactor: "4.2x realtime",
        description: "Balanced latency and accuracy, ideal default for multi-core laptops (~140 MB)",
      },
      {
        id: "small",
        name: "Whisper Small (High-Fi)",
        sizeMb: 460,
        downloaded: true,
        active: false,
        sha256: "1be3a9b2063867b937e64e2ec7483364a73917e1a4c4a45e",
        speedFactor: "2.1x realtime",
        description: "High accuracy for technical terminology (~460 MB)",
      },
    ],
  } as LocalSttStatus,
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getLocalSttStatus: vi.fn().mockResolvedValue(mockSttStatus),
    setLocalSttEngine: vi.fn().mockResolvedValue(undefined),
    setActiveLocalModel: vi.fn().mockResolvedValue(undefined),
    setSttCloudFallback: vi.fn().mockResolvedValue(undefined),
    downloadLocalModel: vi.fn().mockResolvedValue(undefined),
    deleteLocalModel: vi.fn().mockResolvedValue(undefined),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("LocalWhisperCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getLocalSttStatus).mockResolvedValue(mockSttStatus);
  });

  it("renders local offline engine status and hardware diagnostics", async () => {
    renderWithClient(<LocalWhisperCard />);

    await waitFor(() => {
      expect(screen.getByText("Local Offline Engine")).toBeDefined();
      expect(screen.getByText("Cloud Turbo Engine")).toBeDefined();
    });

    expect(screen.getByText(/AVX2 SIMD Enabled/i)).toBeDefined();
    expect(screen.getByText(/16 CPU Threads/i)).toBeDefined();
    expect(screen.getByText(/DirectML \/ GPU Ready/i)).toBeDefined();
    expect(screen.getByText("Whisper Base (Recommended)")).toBeDefined();
  });

  it("switches to cloud turbo engine when clicked", async () => {
    renderWithClient(<LocalWhisperCard />);

    await waitFor(() => {
      expect(screen.getByText("Cloud Turbo Engine")).toBeDefined();
    });

    const cloudBtn = screen.getByText("Cloud Turbo Engine");
    fireEvent.click(cloudBtn);

    await waitFor(() => {
      expect(api.setLocalSttEngine).toHaveBeenCalledWith("cloud");
    });
  });

  it("allows activating a downloaded model", async () => {
    renderWithClient(<LocalWhisperCard />);

    await waitFor(() => {
      expect(screen.getByText("Whisper Small (High-Fi)")).toBeDefined();
    });

    const activateBtns = screen.getAllByRole("button", { name: "Activate" });
    fireEvent.click(activateBtns[0]);

    await waitFor(() => {
      expect(api.setActiveLocalModel).toHaveBeenCalledWith("small");
    });
  });

  it("allows downloading model weights", async () => {
    renderWithClient(<LocalWhisperCard />);

    await waitFor(() => {
      expect(screen.getByText("Whisper Tiny (Quantized)")).toBeDefined();
    });

    const downloadBtn = screen.getByRole("button", { name: /Download/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(api.downloadLocalModel).toHaveBeenCalledWith("tiny");
    });
  });
});
