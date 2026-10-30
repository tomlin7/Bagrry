import type { CalendarEvent } from "./types";

export type ConferenceInfo = {
  provider: "zoom" | "meet" | "teams" | "web" | null;
  url: string | null;
};

/** Extracts Zoom, Google Meet, or Microsoft Teams URLs from event text / location / description */
export function extractConferenceUrl(rawText: string | null | undefined): ConferenceInfo {
  if (!rawText) return { provider: null, url: null };

  // Google Meet
  const meetMatch = rawText.match(/https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i);
  if (meetMatch) {
    return { provider: "meet", url: meetMatch[0] };
  }

  // Zoom
  const zoomMatch = rawText.match(/https:\/\/[a-zA-Z0-9.-]+\.zoom\.us\/j\/\d+(?:\?[^\s"'>]+)?/i);
  if (zoomMatch) {
    return { provider: "zoom", url: zoomMatch[0] };
  }

  // Microsoft Teams
  const teamsMatch = rawText.match(/https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s"'>]+/i);
  if (teamsMatch) {
    return { provider: "teams", url: teamsMatch[0] };
  }

  // Generic https link
  const genericMatch = rawText.match(/https:\/\/[^\s"'>]+/i);
  if (genericMatch) {
    return { provider: "web", url: genericMatch[0] };
  }

  return { provider: null, url: null };
}

export function parseAttendeesList(event: CalendarEvent): { name: string; email?: string }[] {
  if (!event.attendees_json) return [];
  try {
    const parsed = JSON.parse(event.attendees_json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      if (typeof item === "string") return { name: item };
      return {
        name: item.name || item.email || "Attendee",
        email: item.email || undefined,
      };
    });
  } catch {
    return [];
  }
}

/** Determines if an event is currently happening or starting within windowMinutes */
export function isEventStartingSoonOrActive(
  eventStart: Date,
  eventEnd: Date | null,
  now: number = Date.now(),
  windowMinutes: number = 2,
): { status: "starting_soon" | "ongoing" | "past" | "future"; deltaMs: number } {
  const startMs = eventStart.getTime();
  const endMs = eventEnd ? eventEnd.getTime() : startMs + 30 * 60_000;
  const deltaMs = startMs - now;

  if (now >= startMs && now <= endMs) {
    return { status: "ongoing", deltaMs: now - startMs };
  }

  if (deltaMs > 0 && deltaMs <= windowMinutes * 60_000) {
    return { status: "starting_soon", deltaMs };
  }

  if (now > endMs) {
    return { status: "past", deltaMs: now - endMs };
  }

  return { status: "future", deltaMs };
}
