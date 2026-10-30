import { describe, expect, it } from "vitest";
import {
  extractConferenceUrl,
  parseAttendeesList,
  isEventStartingSoonOrActive,
} from "./calendar";
import type { CalendarEvent } from "./types";

describe("Calendar Helpers & Conference URL Extraction", () => {
  it("extracts Google Meet links accurately", () => {
    const text = "Weekly Architecture Sync https://meet.google.com/abc-defg-hij";
    const res = extractConferenceUrl(text);
    expect(res.provider).toBe("meet");
    expect(res.url).toBe("https://meet.google.com/abc-defg-hij");
  });

  it("extracts Zoom links accurately", () => {
    const text = "Sales Demo https://northwind.zoom.us/j/123456789?pwd=secretpassword";
    const res = extractConferenceUrl(text);
    expect(res.provider).toBe("zoom");
    expect(res.url).toBe("https://northwind.zoom.us/j/123456789?pwd=secretpassword");
  });

  it("extracts Microsoft Teams links accurately", () => {
    const text = "Company All-Hands https://teams.microsoft.com/l/meetup-join/19%3ameeting_xyz%40thread.v2/0";
    const res = extractConferenceUrl(text);
    expect(res.provider).toBe("teams");
    expect(res.url).toBe("https://teams.microsoft.com/l/meetup-join/19%3ameeting_xyz%40thread.v2/0");
  });

  it("parses attendees list from JSON", () => {
    const event: CalendarEvent = {
      id: "ev_1",
      title: "Sprint Planning",
      start_at: "2026-11-01 10:00:00",
      end_at: "2026-11-01 11:00:00",
      attendees_json: JSON.stringify([
        { name: "Alex Chen", email: "alex@company.example" },
        { name: "Sarah Lin", email: "sarah@company.example" },
      ]),
    };
    const attendees = parseAttendeesList(event);
    expect(attendees).toHaveLength(2);
    expect(attendees[0].name).toBe("Alex Chen");
    expect(attendees[0].email).toBe("alex@company.example");
  });

  it("determines when event is starting soon or ongoing", () => {
    const now = 1000000;
    const startingSoon = new Date(now + 60_000); // in 1 min
    const ongoingStart = new Date(now - 100_000);
    const ongoingEnd = new Date(now + 500_000);

    const checkSoon = isEventStartingSoonOrActive(startingSoon, null, now, 2);
    expect(checkSoon.status).toBe("starting_soon");

    const checkOngoing = isEventStartingSoonOrActive(ongoingStart, ongoingEnd, now, 2);
    expect(checkOngoing.status).toBe("ongoing");
  });
});
