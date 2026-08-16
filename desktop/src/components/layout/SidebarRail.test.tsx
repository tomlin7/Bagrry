/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import { SidebarRail } from "./SidebarRail";

describe("SidebarRail", () => {
  it("stays mounted while closed so the width tween can play", () => {
    const { rerender, container } = render(
      <SidebarRail open>
        <div>Notes</div>
      </SidebarRail>,
    );

    expect(container.querySelector("[data-open='true']")).toBeTruthy();
    expect(screen.getByText("Notes")).toBeInTheDocument();

    rerender(
      <SidebarRail open={false}>
        <div>Notes</div>
      </SidebarRail>,
    );

    expect(container.querySelector("[data-open='false']")).toBeTruthy();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Notes").closest("[aria-hidden='true']")).toBeTruthy();
  });
});
