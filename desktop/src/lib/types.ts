export type Speaker = "me" | "attendees";

export type DbStatus = {
  path: string;
  sqlite_version: string;
  vec_enabled: boolean;
  meeting_count: number;
  groq_configured: boolean;
  api_port: number;
};

export type Folder = {
  id: string;
  parent_id: string | null;
  name: string;
  is_shared: boolean;
};

export type Meeting = {
  id: string;
  folder_id: string | null;
  title: string;
  date: string;
  duration_ms: number | null;
  calendar_event_id: string | null;
  scratchpad_raw: string;
  enhanced_notes_json: string | null;
  transcript_json: string | null;
  updated_at: string;
};

export type Template = {
  id: string;
  name: string;
  icon: string | null;
  prompt_template: string;
  structure_json: string | null;
};

export type Recipe = {
  id: string;
  name: string;
  icon: string | null;
  prompt_template: string;
};

export type RecState = "idle" | "recording" | "paused";

export type RecStatus = {
  state: RecState;
  pending_bytes?: number;
  pendingBytes?: number;
  loopback_ok?: boolean;
  loopbackOk?: boolean;
  meeting_id?: string | null;
  meetingId?: string | null;
};

export function normalizeRecStatus(status: RecStatus): {
  state: RecState;
  pendingBytes: number;
  loopbackOk: boolean;
  meetingId: string | null;
} {
  return {
    state: status.state,
    pendingBytes: status.pending_bytes ?? status.pendingBytes ?? 0,
    loopbackOk: status.loopback_ok ?? status.loopbackOk ?? false,
    meetingId: status.meeting_id ?? status.meetingId ?? null,
  };
}

export type VuLevels = {
  mic: number;
  system: number;
};

export type Bullet = { text: string; citations: string[] };
export type Section = { section_title: string; bullet_points: Bullet[] };
export type EnhancedDoc = { sections: Section[] };

export type TranscriptSeg = {
  id: string;
  speaker: Speaker | string;
  start_ms: number;
  end_ms: number;
  text: string;
  sentence_index: number;
  sentence_id: string;
};

export type Person = {
  id: string;
  name: string;
  email: string | null;
  domain: string | null;
  company_id: string | null;
};

export type Company = {
  id: string;
  name: string;
  domain: string | null;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  attendees_json: string | null;
};

export type Page =
  | "notes"
  | "search"
  | "people"
  | "companies"
  | "calendar"
  | "settings";
