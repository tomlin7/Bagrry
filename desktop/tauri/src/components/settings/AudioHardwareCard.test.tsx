import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AudioHardwareCard } from "./AudioHardwareCard";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listAudioDevices: vi.fn(),
    getAudioDiagnostics: vi.fn(),
  };
});

describe("AudioHardwareCard (#43)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(api.listAudioDevices).mockResolvedValue([
      { name: "Realtek High Definition Audio", kind: "input", is_default: true },
      { name: "USB Condenser Microphone", kind: "input", is_default: false },
      { name: "Realtek Digital Output", kind: "output", is_default: true },
      { name: "Headphones (WASAPI)", kind: "output", is_default: false },
    ]);

    vi.mocked(api.getAudioDiagnostics).mockResolvedValue({
      default_input: "Realtek High Definition Audio",
      default_output: "Realtek Digital Output",
      wasapi_supported: true,
      sample_rate_hz: 16000,
      latency_ms: 20,
      channels: 2,
    });
  });

  it("renders audio device selector and hardware diagnostics", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AudioHardwareCard />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Audio Hardware & WASAPI Loopback/i)).toBeDefined();
    expect(screen.getByText(/Microphone input/i)).toBeDefined();
    expect(screen.getByText(/Meeting audio output/i)).toBeDefined();
    expect(await screen.findByText(/WASAPI Dual-Channel Active/i)).toBeDefined();
    expect(screen.getByText(/16 kHz Whisper Optimized/i)).toBeDefined();
  });

  it("toggles audio input test meter when button is clicked", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AudioHardwareCard />
      </QueryClientProvider>,
    );

    const testBtn = await screen.findByRole("button", { name: /Test Audio Input/i });
    expect(testBtn).toBeDefined();

    // Click to start test
    fireEvent.click(testBtn);

    expect(await screen.findByText(/Mic Input Level/i)).toBeDefined();
    expect(screen.getByText(/Speech signal detected with low noise floor/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Stop Audio Test/i })).toBeDefined();

    // Click to stop test
    fireEvent.click(screen.getByRole("button", { name: /Stop Audio Test/i }));
    expect(screen.queryByText(/Mic Input Level/i)).toBeNull();
  });
});
