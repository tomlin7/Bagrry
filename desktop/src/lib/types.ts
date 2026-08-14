export type Speaker = "me" | "attendees";

export type DbStatus = {
  path: string;
  sqlite_version: string;
  vec_enabled: boolean;
  meeting_count: number;
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
  updated_at: string;
};

export type Template = {
  id: string;
  name: string;
  icon: string | null;
};

export type RecState = "idle" | "recording" | "paused";

export type RecStatus = {
  state: RecState;
  pending_bytes: number;
  loopback_ok: boolean;
};

export type VuLevels = {
  mic: number;
  system: number;
};
