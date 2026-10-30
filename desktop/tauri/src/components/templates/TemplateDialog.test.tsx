import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TemplateDialog, parseTemplateSections } from "./TemplateDialog";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    saveCustomTemplate: vi.fn().mockResolvedValue({
      id: "tpl_custom_1",
      name: "Design Critique",
      prompt_template: "Focus on UX friction and typography.",
      structure_json: JSON.stringify({ sections: ["UX Friction", "Typography", "Next Steps"] }),
      icon: "rocket",
    }),
    updateCustomTemplate: vi.fn().mockResolvedValue(undefined),
    deleteCustomTemplate: vi.fn().mockResolvedValue(undefined),
  };
});

describe("TemplateDialog & Persona Builder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses template sections from JSON", () => {
    const raw = JSON.stringify({ sections: ["Pain Points", "Budget", "Objections"] });
    expect(parseTemplateSections(raw)).toEqual(["Pain Points", "Budget", "Objections"]);
    expect(parseTemplateSections(null)).toEqual(["Summary", "Action Items"]);
  });

  it("allows creating a new custom meeting template persona", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <TemplateDialog
          open={true}
          onOpenChange={onOpenChange}
          onSelectTemplate={onSelect}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Create Meeting Template")).toBeDefined();

    // Type template name
    const nameInput = screen.getByPlaceholderText(/e\.g\. Design Critique/i);
    fireEvent.change(nameInput, { target: { value: "Design Critique" } });

    // Click icon (Rocket)
    const rocketBtn = screen.getByTitle("Product / Launch");
    fireEvent.click(rocketBtn);

    // Add new section
    const sectionInput = screen.getByPlaceholderText(/\+ Add section\.\.\./i);
    fireEvent.change(sectionInput, { target: { value: "Typography" } });
    fireEvent.keyDown(sectionInput, { key: "Enter" });

    expect(screen.getByText("Typography")).toBeDefined();

    // Submit
    const createBtn = screen.getByRole("button", { name: "Create Template" });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(api.saveCustomTemplate).toHaveBeenCalledWith(
        "Design Critique",
        expect.stringContaining("Anchor on the user scratchpad"),
        expect.stringContaining("Typography"),
        "rocket",
      );
      expect(onSelect).toHaveBeenCalledWith("tpl_custom_1");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("allows editing and deleting an existing custom template", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const onOpenChange = vi.fn();

    const customTemplate = {
      id: "tpl_user_custom",
      name: "Client Feedback",
      prompt_template: "Extract quotes on pricing.",
      structure_json: JSON.stringify({ sections: ["Pricing", "Feedback"] }),
      icon: "briefcase",
    };

    render(
      <QueryClientProvider client={queryClient}>
        <TemplateDialog
          open={true}
          onOpenChange={onOpenChange}
          templateToEdit={customTemplate}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Edit Template Persona")).toBeDefined();
    expect(screen.getByDisplayValue("Client Feedback")).toBeDefined();

    // Click delete
    const deleteBtn = screen.getByRole("button", { name: /Delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteCustomTemplate).toHaveBeenCalledWith("tpl_user_custom");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
