import { invoke } from "@tauri-apps/api/core";
import type { DbStatus, Folder, Meeting, RecStatus, Template } from "./types";

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

export function startRecording() {
  return invoke<RecStatus>("start_recording");
}

export function stopRecording() {
  return invoke<RecStatus>("stop_recording");
}

export function pauseRecording() {
  return invoke<RecStatus>("pause_recording");
}

export function toggleRecording() {
  return invoke<RecStatus>("toggle_recording");
}

export function recordingStatus() {
  return invoke<RecStatus>("recording_status");
}

export function discardAudio() {
  return invoke<RecStatus>("discard_audio");
}
