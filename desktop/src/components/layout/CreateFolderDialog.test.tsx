/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { FOLDER_TEMPLATES } from "@/lib/folder-templates";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    createFolder: vi.fn(),
  };
});

function renderDialog(initialShared = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onOpenChange = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <CreateFolderDialog open initialShared={initialShared} workspaceName="Dheeraj" onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

describe("CreateFolderDialog", () => {
  it("keeps Create disabled until a name is entered", () => {
    renderDialog();
    expect(screen.getByRole("heading", { name: "Create folder" })).toBeInTheDocument();
    const create = screen.getByRole("button", { name: "Create" });
    expect(create).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Sales" } });
    expect(create).toBeEnabled();
  });

  it("fills name and description from a template chip", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    const projects = FOLDER_TEMPLATES.find((t) => t.id === "projects")!;
    expect(screen.getByPlaceholderText("Name")).toHaveValue(projects.name);
    expect(screen.getByPlaceholderText("Describe the purpose of this folder")).toHaveValue(projects.description);
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("defaults the space to the team when opened from a shared Add folder", () => {
    renderDialog(true);
    expect(screen.getByText("Everyone in your workspace will be able to view this folder.")).toBeInTheDocument();
    expect(screen.getByText("Dheeraj team")).toBeInTheDocument();
  });
});
