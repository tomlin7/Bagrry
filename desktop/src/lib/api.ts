import { invoke } from "@tauri-apps/api/core";
import type { DbStatus, Folder, Meeting, Template } from "./types";

export function dbStatus() {
  return invoke<DbStatus>("db_status");
}

export function listMeetings() {
  return invoke<Meeting[]>("list_meetings");
}

export function listFolders() {
  return invoke<Folder[]>("list_folders");
}

export function listTemplates() {
  return invoke<Template[]>("list_templates");
}

export function createMeeting(title: string, folderId?: string | null) {
  return invoke<Meeting>("create_meeting", {
    title,
    folder_id: folderId ?? null,
  });
}
