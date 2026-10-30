import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompanyDossierDialog } from "./CompanyDossierDialog";
import * as api from "@/lib/api";

const { mockDossier } = vi.hoisted(() => ({
  mockDossier: {
    company: {
      id: "co_stripe",
      name: "Stripe",
      domain: "stripe.com",
      note_count: 3,
      last_note_at: "2026-10-30 15:00:00",
    },
    attendees: [
      {
        id: "p_patrick",
        name: "Patrick Collison",
        email: "patrick@stripe.com",
        domain: "stripe.com",
        company_id: "co_stripe",
        company_name: "Stripe",
        role: "CEO",
        notes: null,
        excluded: false,
        note_count: 3,
        total_duration_ms: 5400000,
        last_note_at: "2026-10-30 15:00:00",
      },
    ],
    meetings: [
      {
        id: "mtg_stripe_arch",
        folder_id: null,
        title: "Stripe API architecture review",
        date: "2026-10-30 15:00:00",
        duration_ms: 1800000,
        scratchpad_raw: "Architecture discussion",
        enhanced_notes_json: null,
        transcript_json: null,
      },
    ],
    action_items: [
      {
        id: "act_deliverable",
        meeting_id: "mtg_stripe_arch",
        meeting_title: "Stripe API architecture review",
        owner: "Patrick Collison",
        task: "Provide staging webhook endpoint",
        deadline: "2026-11-01",
        done: false,
      },
    ],
    account_brief: "Account briefing for Stripe:\n• 1 recorded meeting(s) with 1 key contact(s).",
  },
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getCompanyDossier: vi.fn(async () => mockDossier),
    updateCompany: vi.fn(async (id: string, name: string, domain?: string | null) => ({
      ...mockDossier.company,
      id,
      name,
      domain: domain ?? null,
    })),
    setActionItemDone: vi.fn(async () => {}),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CompanyDossierDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders company dossier with overview, account brief, and quick contacts", async () => {
    renderWithClient(
      <CompanyDossierDialog
        companyId="co_stripe"
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Stripe")).toBeInTheDocument();
      expect(screen.getByText("stripe.com")).toBeInTheDocument();
      expect(screen.getByText(/Account Intelligence Brief/i)).toBeInTheDocument();
      expect(screen.getByText("Patrick Collison")).toBeInTheDocument();
    });
  });

  it("switches to contacts tab and displays attendee profile", async () => {
    renderWithClient(
      <CompanyDossierDialog
        companyId="co_stripe"
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Stripe")).toBeInTheDocument();
    });

    const contactsTab = screen.getByRole("button", { name: /Contacts \(1\)/i });
    fireEvent.click(contactsTab);

    expect(screen.getByText("Patrick Collison")).toBeInTheDocument();
    expect(screen.getByText("CEO")).toBeInTheDocument();
    expect(screen.getByText("patrick@stripe.com")).toBeInTheDocument();
  });

  it("switches to open loops tab and toggles task completion", async () => {
    renderWithClient(
      <CompanyDossierDialog
        companyId="co_stripe"
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Stripe")).toBeInTheDocument();
    });

    const tasksTab = screen.getByRole("button", { name: /Open Loops \(1\)/i });
    fireEvent.click(tasksTab);

    expect(screen.getByText("Provide staging webhook endpoint")).toBeInTheDocument();

    const taskCheckbox = screen.getByRole("button", { name: /Toggle task status/i });
    fireEvent.click(taskCheckbox);

    await waitFor(() => {
      expect(api.setActionItemDone).toHaveBeenCalledWith("act_deliverable", true);
    });
  });

  it("allows editing company name and domain", async () => {
    renderWithClient(
      <CompanyDossierDialog
        companyId="co_stripe"
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Stripe")).toBeInTheDocument();
    });

    const editBtn = screen.getByTitle("Edit company details");
    fireEvent.click(editBtn);

    expect(screen.getByText(/Edit Company Details/i)).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateCompany).toHaveBeenCalledWith("co_stripe", "Stripe", "stripe.com");
    });
  });
});
