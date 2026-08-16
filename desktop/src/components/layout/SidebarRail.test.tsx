/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import { SidebarRail } from "./SidebarRail";

describe("SidebarRail", () => {
  it("stays mounted while closed so the slide can play", () => {
    const { rerender, container } = render(
      <SidebarRail open>
        <div>Notes</div>
      </SidebarRail>,
    );

    const rail = container.querySelector(".sidebar-rail");
    expect(rail).toHaveAttribute("data-open", "true");
    expect(screen.getByText("Notes")).toBeInTheDocument();

    rerender(
      <SidebarRail open={false}>
        <div>Notes</div>
      </SidebarRail>,
    );

    expect(rail).toHaveAttribute("data-open", "false");
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(container.querySelector(".sidebar-rail-inner")).toHaveAttribute("aria-hidden", "true");
  });
});
