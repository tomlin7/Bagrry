import { describe, expect, it } from "vitest";
import { SETTINGS_PERSONAL_NAV, SETTINGS_WORKSPACE_NAV } from "./settings-nav";

describe("settings nav", () => {
  it("lists personal items with Preferences first", () => {
    expect(SETTINGS_PERSONAL_NAV.map((e) => e.tab)).toEqual([
      "preferences",
      "profile",
      "calendar",
      "notifications",
      "connectors",
      "help",
    ]);
  });

  it("lists workspace items including Referrals", () => {
    expect(SETTINGS_WORKSPACE_NAV.map((e) => e.tab)).toEqual([
      "workspace-general",
      "members",
      "spaces",
      "analytics",
      "billing",
      "referrals",
    ]);
  });
});
