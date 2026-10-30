import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PeoplePage } from "./PeoplePage";
import * as api from "@/lib/api";

const { mockPeople, mockMeetings, mockProfile } = vi.hoisted(() => ({
  mockProfile: {
    id: "usr_me",
    name: "Dheeraj",
    email: "dheeraj@example.com",
    avatar_url: null,
  },
  mockPeople: [
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
      note_count: 2,
      total_duration_ms: 3600000,
      last_note_at: "2026-10-28 14:00:00",
    },
    {
      id: "p_bot",
      name: "Meeting Bot",
      email: "bot@notetaker.example",
      domain: "notetaker.example",
      company_id: null,
      company_name: null,
      role: null,
      notes: null,
      excluded: true,
      note_count: 5,
      total_duration_ms: 7200000,
      last_note_at: "2026-10-29 10:00:00",
    },
  ],
  mockMeetings: [
    {
      id: "mtg_pricing",
      folder_id: "folder_sales",
      title: "Northwind pricing review",
      date: "2026-10-28 14:00:00",
      duration_ms: 1800000,
      scratchpad_raw: "Discussion notes",
      enhanced_notes_json: null,
      transcript_json: null,
    },
  ],
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getProfile: vi.fn().mockResolvedValue(mockProfile),
    listPeople: vi.fn().mockResolvedValue(mockPeople),
    listMeetings: vi.fn().mockResolvedValue(mockMeetings),
    indexAllAttendees: vi.fn().mockResolvedValue(2),
    upsertPerson: vi.fn().mockResolvedValue({
      id: "p_new",
      name: "Jordan Lee",
      email: "jordan@example.com",
      domain: "example.com",
      company_id: null,
      company_name: null,
      role: null,
      notes: null,
      excluded: false,
      note_count: 0,
      total_duration_ms: 0,
      last_note_at: null,
    }),
    getPersonDossier: vi.fn().mockResolvedValue({
      person: mockPeople[0],
      meetings: mockMeetings,
      action_items: [],
      catch_me_up_brief: null,
    }),
  };
});

describe("PeoplePage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders people directory and triggers auto-index attendees action", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PeoplePage />
      </QueryClientProvider>
    );

    // Directory header
    expect(await screen.findByText("Alex Chen")).toBeInTheDocument();
    expect(screen.getByText(/Northwind Labs/i)).toBeInTheDocument();

    // Trigger auto-index attendees
    const indexBtn = screen.getByRole("button", { name: /Index Attendees/i });
    fireEvent.click(indexBtn);

    await waitFor(() => {
      expect(api.indexAllAttendees).toHaveBeenCalled();
    });
  });

  it("supports adding a new contact via modal", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PeoplePage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Alex Chen")).toBeInTheDocument();

    // Open add contact modal
    const addBtn = screen.getByRole("button", { name: /Add Contact/i });
    fireEvent.click(addBtn);

    expect(screen.getByText("Add New Contact")).toBeInTheDocument();

    // Enter name and email
    const nameInput = screen.getByPlaceholderText("e.g. Jordan Miller");
    const emailInput = screen.getByPlaceholderText("e.g. jordan@example.com");

    fireEvent.change(nameInput, { target: { value: "Jordan Lee" } });
    fireEvent.change(emailInput, { target: { value: "jordan@example.com" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: "Add Contact" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.upsertPerson).toHaveBeenCalledWith("Jordan Lee", "jordan@example.com");
    });
  });

  it("filters excluded contacts in privacy scope", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PeoplePage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Alex Chen")).toBeInTheDocument();
    // Meeting Bot is excluded by default in "Everyone" scope
    expect(screen.queryByText("Meeting Bot")).not.toBeInTheDocument();

    // Switch to "Excluded" scope
    const excludedFilter = screen.getByRole("button", { name: "Excluded" });
    fireEvent.click(excludedFilter);

    expect(await screen.findByText("Meeting Bot")).toBeInTheDocument();
  });
});
