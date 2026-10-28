import { describe, expect, it } from "vitest";
import {
  companyNameFromDomain,
  filterDirectory,
  mergeDomainCompanies,
  mergeSelfIntoPeople,
  sortByLastNote,
} from "./directory";
import type { Company, Meeting, Person, Profile } from "./types";

const profile: Profile = {
  name: "Dheeraj",
  email: "btech60084.23@bitmesra.ac.in",
  workspace: "Dheeraj",
};

const meetings: Meeting[] = [
  {
    id: "m1",
    folder_id: null,
    title: "Standup",
    date: "2026-08-15 10:00:00",
    duration_ms: null,
    calendar_event_id: null,
    scratchpad_raw: "",
    scratchpad_json: null,
    enhanced_notes_json: null,
    transcript_json: null,
    updated_at: "2026-08-15 10:00:00",
  },
];

describe("directory helpers", () => {
  it("names a company from its domain", () => {
    expect(companyNameFromDomain("bitmesra.ac.in")).toBe("Bitmesra");
  });

  it("inserts the signed-in user when they are not already in attendees", () => {
    const people = mergeSelfIntoPeople([], profile, meetings);
    expect(people).toHaveLength(1);
    expect(people[0]?.is_me).toBe(true);
    expect(people[0]?.email).toBe(profile.email);
    expect(people[0]?.note_count).toBe(1);
  });

  it("marks an existing attendee as me instead of duplicating", () => {
    const existing: Person = {
      id: "p1",
      name: "Dheeraj Charaungonath",
      email: profile.email,
      domain: "bitmesra.ac.in",
      company_id: null,
      note_count: 1,
      last_note_at: meetings[0]!.date,
    };
    const people = mergeSelfIntoPeople([existing], profile, meetings);
    expect(people).toHaveLength(1);
    expect(people[0]?.is_me).toBe(true);
    expect(people[0]?.id).toBe("p1");
  });

  it("synthesizes a company from the user's email domain", () => {
    const people = mergeSelfIntoPeople([], profile, meetings);
    const companies = mergeDomainCompanies([], people, meetings);
    expect(companies).toHaveLength(1);
    expect(companies[0]?.name).toBe("Bitmesra");
    expect(companies[0]?.domain).toBe("bitmesra.ac.in");
  });

  it("hides people with no notes on the People I met filter", () => {
    const rows: Person[] = [
      {
        id: "a",
        name: "Alex",
        email: null,
        domain: null,
        company_id: null,
        note_count: 2,
        last_note_at: "2026-08-01 00:00:00",
      },
      {
        id: "b",
        name: "Blair",
        email: null,
        domain: null,
        company_id: null,
        note_count: 0,
        last_note_at: null,
      },
    ];
    expect(filterDirectory(rows, "", true).map((r) => r.id)).toEqual(["a"]);
    expect(filterDirectory(rows, "bla", false).map((r) => r.id)).toEqual(["b"]);
  });

  it("sorts empty last-note rows after dated ones", () => {
    const rows: Company[] = [
      { id: "1", name: "Zed", domain: null, note_count: 0, last_note_at: null },
      { id: "2", name: "Acme", domain: null, note_count: 1, last_note_at: "2026-08-15 00:00:00" },
    ];
    expect(sortByLastNote(rows, "desc").map((r) => r.id)).toEqual(["2", "1"]);
  });
});
