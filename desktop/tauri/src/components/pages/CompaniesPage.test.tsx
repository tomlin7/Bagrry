import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompaniesPage } from "./CompaniesPage";
import * as api from "@/lib/api";

const { mockCompanies } = vi.hoisted(() => ({
  mockCompanies: [
    {
      id: "co_stripe",
      name: "Stripe",
      domain: "stripe.com",
      note_count: 5,
      last_note_at: "2026-10-30 15:00:00",
    },
    {
      id: "co_acme",
      name: "Acme Corp",
      domain: "acme.corp",
      note_count: 2,
      last_note_at: "2026-10-25 11:00:00",
    },
  ],
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listCompanies: vi.fn(async () => mockCompanies),
    autoIndexCompanies: vi.fn(async () => 2),
    getCompanyDossier: vi.fn(async (id: string) => ({
      company: mockCompanies.find((c) => c.id === id) || mockCompanies[0],
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
          note_count: 5,
          total_duration_ms: 7200000,
          last_note_at: "2026-10-30 15:00:00",
        },
      ],
      meetings: [
        {
          id: "mtg_sync",
          folder_id: null,
          title: "Stripe partnership kick-off",
          date: "2026-10-30 15:00:00",
          duration_ms: 1800000,
          scratchpad_raw: "Discussion points",
          enhanced_notes_json: null,
          transcript_json: null,
        },
      ],
      action_items: [
        {
          id: "act_1",
          meeting_id: "mtg_sync",
          meeting_title: "Stripe partnership kick-off",
          owner: "Dheeraj",
          task: "Send API contract specs",
          deadline: "2026-11-05",
          done: false,
        },
      ],
      account_brief: "Account briefing for Stripe:\n• 1 recorded meeting(s) with 1 key contact(s).",
    })),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CompaniesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders companies list and company counts", async () => {
    renderWithClient(<CompaniesPage />);

    expect(screen.getByText(/Companies & Organizations/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Stripe")).toBeInTheDocument();
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      expect(screen.getByText("stripe.com")).toBeInTheDocument();
      expect(screen.getByText("acme.corp")).toBeInTheDocument();
    });
  });

  it("filters companies when typing in search input", async () => {
    renderWithClient(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText("Stripe")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search organizations or domains/i);
    fireEvent.change(searchInput, { target: { value: "stripe" } });

    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });

  it("triggers auto-index accounts mutation when clicked", async () => {
    renderWithClient(<CompaniesPage />);

    const autoIndexBtn = screen.getByRole("button", { name: /Auto-Index Accounts/i });
    fireEvent.click(autoIndexBtn);

    await waitFor(() => {
      expect(api.autoIndexCompanies).toHaveBeenCalledTimes(1);
    });
  });

  it("opens company dossier dialog when clicking a company card", async () => {
    renderWithClient(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText("Stripe")).toBeInTheDocument();
    });

    const stripeCard = screen.getByText("Stripe").closest("div");
    if (stripeCard) {
      fireEvent.click(stripeCard);
    }

    await waitFor(() => {
      expect(api.getCompanyDossier).toHaveBeenCalledWith("co_stripe");
      expect(screen.getByText(/Account Intelligence Brief/i)).toBeInTheDocument();
    });
  });
});
