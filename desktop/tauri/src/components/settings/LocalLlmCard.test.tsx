import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocalLlmCard } from "./LocalLlmCard";
import * as api from "@/lib/api";
import type { LocalLlmStatus } from "@/lib/types";

const { mockLlmStatus } = vi.hoisted(() => ({
  mockLlmStatus: {
    engine: "local" as const,
    activeModel: "qwen2.5-0.5b",
    hardwareBackend: "DirectML & AVX2 Accelerated (GGUF)",
    cpuThreads: 16,
    contextTokens: 4096,
    cloudFallback: true,
    models: [
      {
        id: "qwen2.5-0.5b",
        name: "Qwen 2.5 0.5B Instruct (GGUF)",
        sizeMb: 350,
        downloaded: true,
        active: true,
        sha256: "c3a918f4a1200b3f5e921d2a45c6e83017a4c7e81b3d0a2f",
        speedFactor: "~35 tokens/s (CPU AVX2)",
        description: "Ultra-fast low-latency local inference.",
        parameters: "0.5 Billion",
        quantization: "Q4_K_M",
      },
      {
        id: "llama-3.2-1b",
        name: "Llama 3.2 1B Instruct (GGUF)",
        sizeMb: 850,
        downloaded: false,
        active: false,
        sha256: "7e4d82a15f019b8417c38e920d35a61b7e41d892a015c7e3",
        speedFactor: "~22 tokens/s (CPU AVX2)",
        description: "Meta's lightweight model.",
        parameters: "1.2 Billion",
        quantization: "Q4_K_M",
      },
      {
        id: "phi-3.5-mini",
        name: "Phi 3.5 Mini 3.8B (GGUF)",
        sizeMb: 2200,
        downloaded: true,
        active: false,
        sha256: "9a12b4e5c83017d6e4f21a830b5c7d812e4f0192a35b6c7e",
        speedFactor: "~11 tokens/s (DirectML/GPU)",
        description: "Microsoft's flagship reasoning SLM.",
        parameters: "3.8 Billion",
        quantization: "Q4_K_M",
      },
    ],
  } as LocalLlmStatus,
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getLocalLlmStatus: vi.fn().mockImplementation(() => Promise.resolve(mockLlmStatus)),
    setLocalLlmEngine: vi.fn().mockResolvedValue(undefined),
    setActiveLocalLlmModel: vi.fn().mockResolvedValue(undefined),
    setLlmCloudFallback: vi.fn().mockResolvedValue(undefined),
    downloadLocalLlmModel: vi.fn().mockResolvedValue(undefined),
    deleteLocalLlmModel: vi.fn().mockResolvedValue(undefined),
  };
});

describe("LocalLlmCard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderWithClient = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  it("renders on-device GGUF models and hardware acceleration info", async () => {
    renderWithClient(<LocalLlmCard />);

    expect(
      await screen.findByText("On-Device LLM Inference (Zero-Cloud Summaries)"),
    ).toBeDefined();
    expect(screen.getByText("DirectML & AVX2 Accelerated (GGUF)")).toBeDefined();
    expect(screen.getByText("16 CPU Threads")).toBeDefined();
    expect(screen.getByText("4096 Context Tokens")).toBeDefined();

    // Models present
    expect(screen.getByText("Qwen 2.5 0.5B Instruct (GGUF)")).toBeDefined();
    expect(screen.getByText("Llama 3.2 1B Instruct (GGUF)")).toBeDefined();
    expect(screen.getByText("Phi 3.5 Mini 3.8B (GGUF)")).toBeDefined();
    expect(screen.getByText("Active Model")).toBeDefined();
  });

  it("allows switching between Local On-Device and Cloud LLM", async () => {
    renderWithClient(<LocalLlmCard />);

    const cloudBtn = await screen.findByText("Cloud LLM (Groq / OpenRouter)");
    fireEvent.click(cloudBtn);

    await waitFor(() => {
      expect(api.setLocalLlmEngine).toHaveBeenCalledWith("cloud");
    });
  });

  it("allows activating a downloaded local GGUF model", async () => {
    renderWithClient(<LocalLlmCard />);

    const activateBtn = await screen.findByRole("button", { name: "Activate" });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(api.setActiveLocalLlmModel).toHaveBeenCalledWith("phi-3.5-mini");
    });
  });

  it("triggers GGUF weights download when clicking Download button", async () => {
    renderWithClient(<LocalLlmCard />);

    const downloadBtn = await screen.findByRole("button", { name: /Download GGUF/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(api.downloadLocalLlmModel).toHaveBeenCalledWith("llama-3.2-1b");
    });
  });
});
