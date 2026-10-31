import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfileTab } from "./ProfileTab";
import * as api from "@/lib/api";

const { mockProfile, mockVaultResult } = vi.hoisted(() => ({
  mockProfile: {
    name: "Dheeraj",
    email: "dheeraj@example.com",
    workspace: "Acme Corp",
  },
  mockVaultResult: {
    vault_path: "C:/Users/BIT/Downloads/Bagrry-Obsidian-Vault-20261031",
    total_files: 18,
    total_folders: 4,
  },
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getProfile: vi.fn().mockResolvedValue(mockProfile),
    setProfile: vi.fn().mockResolvedValue(undefined),
    exportWorkspaceVault: vi.fn().mockResolvedValue(mockVaultResult),
    exportCsv: vi.fn().mockResolvedValue("C:/Users/BIT/Downloads/bagrry-notes.csv"),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("ProfileTab & Obsidian Vault Export (#51)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile settings and displays Obsidian Vault export row", async () => {
    renderWithClient(<ProfileTab />);

    expect(await screen.findByDisplayValue("Dheeraj")).toBeDefined();
    expect(screen.getByText("Export Obsidian Markdown Vault")).toBeDefined();
    expect(
      screen.getByText(/1-Click export of your entire workspace to an Obsidian\/Logseq vault/i),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Export Obsidian Markdown Vault" })).toBeDefined();
  });

  it("triggers 1-click workspace export to Obsidian compatible vault", async () => {
    renderWithClient(<ProfileTab />);

    const exportBtn = await screen.findByRole("button", { name: "Export Obsidian Markdown Vault" });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(api.exportWorkspaceVault).toHaveBeenCalledWith(null);
    });
  });
});