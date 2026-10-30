import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersonDossierDialog } from "./PersonDossierDialog";
import * as api from "@/lib/api";

const { mockDossier, mockPeople } = vi.hoisted(() => ({
  mockDossier: {
    person: {
      id: "p_alex",
      name: "Alex Chen",
      email: "alex@northwind.example",
      domain: "northwind.example",
      company_id: "co_northwind",
      company_name: "Northwind Labs",
      role: "Head of Infrastructure",
      notes: "Preferred timezone: PT. Leads cloud migration.",
      excluded: false,
      note_count: 3,
      total_duration_ms: 5400000,
      last_note_at: "2026-10-28 14:00:00",
    },
    meetings: [
      {
        id: "mtg_pricing",
        folder_id: "folder_sales",
        title: "Northwind pricing review",
        date: "2026-10-28 14:00:00",
        duration_ms: 1800000,
        scratchpad_raw: "- $14/user annual\n- quarterly true-ups",
        enhanced_notes_json: null,
        transcript_json: null,
      },
    ],
    action_items: [
      {
        id: "act_1",
        meeting_id: "mtg_pricing",
        meeting_title: "Northwind pricing review",
        owner: "Alex Chen",
        task: "Send signed security DPA",
        deadline: "2026-11-02 17:00:00",
        done: false,
      },
    ],
    catch_me_up_brief:
      "### Recent Discussion: Northwind pricing review\n*Met on 2026-10-28*\n• $14/user annual\n• quarterly true-ups\n\n### Unresolved Commitments\n- [ ] **Alex Chen**: Send signed security DPA",
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
      note_count: 3,
      total_duration_ms: 5400000,
      last_note_at: "2026-10-28 14:00:00",
    },
    {
      id: "p_alex_dup",
      name: "Alexander C.",
      email: "alex.c@northwind.example",
      domain: "northwind.example",
      company_id: "co_northwind",
      company_name: "Northwind Labs",
      role: null,
      notes: null,
      excluded: false,
      note_count: 1,
      total_duration_ms: 1200000,
      last_note_at: "2026-10-20 10:00:00",
    },
  ],
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getPersonDossier: vi.fn().mockResolvedValue(mockDossier),
    listPeople: vi.fn().mockResolvedValue(mockPeople),
    updatePerson: vi.fn().mockResolvedValue({
      ...mockDossier.person,
      role: "VP of Engineering",
    }),
    setActionItemDone: vi.fn().mockResolvedValue(undefined),
    mergePeople: vi.fn().mockResolvedValue(undefined),
    deletePerson: vi.fn().mockResolvedValue(undefined),
  };
});

describe("PersonDossierDialog", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders attendee profile, metrics, and 'Catch Me Up' pre-meeting briefing", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PersonDossierDialog personId="p_alex" open={true} onOpenChange={() => {}} />
      </QueryClientProvider>
    );

    // Profile details
    expect(await screen.findByText("Alex Chen")).toBeInTheDocument();
    expect(screen.getByText("Head of Infrastructure")).toBeInTheDocument();
    expect(screen.getByText("Northwind Labs")).toBeInTheDocument();
    expect(screen.getByText("alex@northwind.example")).toBeInTheDocument();

    // Catch me up briefing card
    expect(screen.getByText(/Catch Me Up · Pre-Meeting Briefing/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Discussion: Northwind pricing review/i)).toBeInTheDocument();
    expect(screen.getByText(/quarterly true-ups/i)).toBeInTheDocument();

    // Metrics bar
    expect(screen.getByText("Meetings")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("switches to open loops tab and toggles action item status", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PersonDossierDialog personId="p_alex" open={true} onOpenChange={() => {}} />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Alex Chen")).toBeInTheDocument();

    // Click Open Loops tab
    const tasksTab = screen.getByRole("button", { name: /Open Loops/i });
    fireEvent.click(tasksTab);

    expect(await screen.findByText("Send signed security DPA")).toBeInTheDocument();

    // Click toggle completion button
    const toggleButton = screen.getByRole("button", { name: "" });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(api.setActionItemDone).toHaveBeenCalledWith("act_1", true);
    });
  });

  it("allows editing attendee details and saving", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PersonDossierDialog personId="p_alex" open={true} onOpenChange={() => {}} />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Alex Chen")).toBeInTheDocument();

    // Click Edit button
    const editBtn = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editBtn);

    expect(screen.getByText("Edit Contact Details")).toBeInTheDocument();

    // Change role input
    const roleInput = screen.getByDisplayValue("Head of Infrastructure");
    fireEvent.change(roleInput, { target: { value: "VP of Engineering" } });

    // Save changes
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updatePerson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "p_alex",
          name: "Alex Chen",
          role: "VP of Engineering",
        })
      );
    });
  });
});
