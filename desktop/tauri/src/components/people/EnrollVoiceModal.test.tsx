import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EnrollVoiceModal } from "./EnrollVoiceModal";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listVoiceProfiles: vi.fn(),
    enrollVoiceProfile: vi.fn(),
    deleteVoiceProfile: vi.fn(),
  };
});

describe("EnrollVoiceModal (#63)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders empty state and allows recording a voice sample", async () => {
    vi.mocked(api.listVoiceProfiles).mockResolvedValue([]);
    vi.mocked(api.enrollVoiceProfile).mockResolvedValue({
      id: "vpr_101",
      personId: "p_alex",
      name: "Alex Rivera",
      sampleCount: 1,
      updatedAt: "Epoch 100",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <EnrollVoiceModal
          open={true}
          onClose={vi.fn()}
          personId="p_alex"
          personName="Alex Rivera"
        />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Voice Biometrics Enrollment/i)).toBeDefined();
    expect(await screen.findByText(/No voice profile enrolled yet/i)).toBeDefined();

    const recordBtn = screen.getByRole("button", { name: /Record Voiceprint Sample/i });
    fireEvent.click(recordBtn);

    expect(api.enrollVoiceProfile).toBeDefined();
  });

  it("displays active status and sample count when profile is enrolled", async () => {
    vi.mocked(api.listVoiceProfiles).mockResolvedValue([
      {
        id: "vpr_101",
        personId: "p_alex",
        name: "Alex Rivera",
        sampleCount: 2,
        updatedAt: "Epoch 100",
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <EnrollVoiceModal
          open={true}
          onClose={vi.fn()}
          personId="p_alex"
          personName="Alex Rivera"
        />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Enrolled & Active/i)).toBeDefined();
    expect(screen.getByText(/2 acoustic samples/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Delete Profile/i })).toBeDefined();
  });
});
