import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandPalette } from "./CommandPalette";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";

const { mockGlobalResult, mockRecentMeetings } = vi.hoisted(() => ({
  mockGlobalResult: {
    hits: [
      {
        id: "mtg_pricing",
        title: "Northwind pricing review",
        date: "2026-10-28 14:00:00",
        snippet: "Agreed on fourteen dollars with quarterly <mark>true-ups</mark> and DPA.",
        folder_name: "Sales",
        attendees: ["Alex Chen"],
        has_open_loops: true,
      },
    ],
    matched_people: [
      {
        id: "p_alex",
        name: "Alex Chen",
        email: "alex@northwind.example",
        domain: "northwind.example",
        company_id: "co_northwind",
        company_name: "Northwind Labs",
        role: "Head of Infrastructure",
        notes: null,
        excluded: false,
        note_count: 3,
        total_duration_ms: 5400000,
        last_note_at: "2026-10-28 14:00:00",
      },
    ],
  },
  mockRecentMeetings: [
    {
      id: "mtg_sample",
      folder_id: "folder_sales",
      title: "Northwind pricing review",
      date: "2026-10-28 14:00:00",
      duration_ms: 1800000,
      scratchpad_raw: "Notes",
      enhanced_notes_json: null,
      transcript_json: null,
    },
  ],
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    searchGlobal: vi.fn().mockResolvedValue(mockGlobalResult),
    listMeetings: vi.fn().mockResolvedValue(mockRecentMeetings),
  };
});

describe("CommandPalette", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAppStore.setState({ paletteOpen: true });
  });

  it("renders command palette and allows searching with highlighted snippet and attendees", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommandPalette />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/Search notes, transcripts, people/i);
    expect(input).toBeInTheDocument();

    // Type query
    fireEvent.change(input, { target: { value: "true-ups" } });

    // Wait for debounced search and verify results
    await waitFor(() => {
      expect(api.searchGlobal).toHaveBeenCalledWith("true-ups");
    });

    // Check hit title, folder badge, open loops badge, and attendees
    expect(await screen.findByText("Northwind pricing review")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Open Loops")).toBeInTheDocument();
    expect(screen.getAllByText("Alex Chen").length).toBeGreaterThanOrEqual(1);

    // Verify highlighted snippet
    expect(screen.getByText("true-ups").tagName.toLowerCase()).toBe("mark");
  });

  it("toggles syntax filter chips when clicked", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommandPalette />
      </QueryClientProvider>
    );

    const filterBtn = screen.getByRole("button", { name: /has:loop/i });
    fireEvent.click(filterBtn);

    const input = screen.getByPlaceholderText(/Search notes, transcripts, people/i) as HTMLInputElement;
    expect(input.value).toContain("has:loop");
  });

  it("displays matched people section in search results", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CommandPalette />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/Search notes, transcripts, people/i);
    fireEvent.change(input, { target: { value: "alex" } });

    await waitFor(() => {
      expect(api.searchGlobal).toHaveBeenCalledWith("alex");
    });

    expect(await screen.findByText("People & Attendees")).toBeInTheDocument();
    expect(screen.getByText("(Head of Infrastructure)")).toBeInTheDocument();
  });
});
