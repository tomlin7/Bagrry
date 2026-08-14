import { invoke } from "@tauri-apps/api/core";
import type {
  CalendarEvent,
  Company,
  DbStatus,
  Folder,
  Meeting,
  Person,
  Recipe,
  RecStatus,
  Template,
  TranscriptSeg,
} from "./types";

export const listMeetings = (folderId?: string | null) =>
  invoke<Meeting[]>("list_meetings", { folder_id: folderId ?? null });
export const getMeeting = (id: string) => invoke<Meeting>("get_meeting", { id });
export const listFolders = () => invoke<Folder[]>("list_folders");
export const listTemplates = () => invoke<Template[]>("list_templates");
export const listRecipes = () => invoke<Recipe[]>("list_recipes");
export const dbStatus = () => invoke<DbStatus>("db_status");
export const createMeeting = (title: string, folderId?: string | null) =>
  invoke<Meeting>("create_meeting", { title, folder_id: folderId ?? null });
export const saveScratchpad = (id: string, scratchpad_raw: string) =>
  invoke<void>("save_scratchpad", { id, scratchpad_raw });
export const saveTitle = (id: string, title: string) => invoke<void>("save_title", { id, title });
export const startRecording = () => invoke<RecStatus>("start_recording");
export const stopRecording = () => invoke<RecStatus>("stop_recording");
export const pauseRecording = () => invoke<RecStatus>("pause_recording");
export const recordingStatus = () => invoke<RecStatus>("recording_status");
export const discardAudio = () => invoke<RecStatus>("discard_audio");
export const transcribePending = (meeting_id: string) =>
  invoke<TranscriptSeg[]>("transcribe_pending", { meeting_id });
export const listSegments = (meeting_id: string) =>
  invoke<TranscriptSeg[]>("list_segments", { meeting_id });
export const enhanceMeeting = (meeting_id: string, template_id?: string | null) =>
  invoke<string>("enhance_meeting", { meeting_id, template_id: template_id ?? null });
export const runRecipe = (meeting_id: string, recipe_id: string) =>
  invoke<string>("run_recipe", { meeting_id, recipe_id });
export const repromptSelection = (meeting_id: string, selection: string, instruction: string) =>
  invoke<string>("reprompt_selection", { meeting_id, selection, instruction });
export const askBagrry = (query: string, folder_id?: string | null, meeting_id?: string | null) =>
  invoke<string>("ask_bagrry", { query, folder_id: folder_id ?? null, meeting_id: meeting_id ?? null });
export const liveAsk = (query: string, live_transcript: string) =>
  invoke<string>("live_ask", { query, live_transcript });
export const searchMeetings = (query: string) => invoke<Meeting[]>("search_meetings", { query });
export const listPeople = () => invoke<Person[]>("list_people");
export const listCompanies = () => invoke<Company[]>("list_companies");
export const upsertPerson = (name: string, email?: string | null) =>
  invoke<Person>("upsert_person", { name, email: email ?? null });
export const meetingsForPerson = (person_id: string) =>
  invoke<Meeting[]>("meetings_for_person", { person_id });
export const listCalendar = () => invoke<CalendarEvent[]>("list_calendar");
export const upsertCalendarEvent = (title: string, start_at: string, attendees_json?: string | null) =>
  invoke<CalendarEvent>("upsert_calendar_event", {
    title,
    start_at,
    attendees_json: attendees_json ?? null,
  });
export const preMeetingBrief = (attendees_json: string) =>
  invoke<string>("pre_meeting_brief", { attendees_json });
export const setSecret = (key: string, value: string) => invoke<void>("set_secret", { key, value });
export const setSetting = (key: string, value: string) => invoke<void>("set_setting", { key, value });
export const getSetting = (key: string) => invoke<string>("get_setting", { key });
export const copyConsent = () => invoke<string>("copy_consent");
export const createShare = (meeting_id: string) => invoke<string>("create_share", { meeting_id });
export const dispatchWebhook = (meeting_id: string) => invoke<string>("dispatch_webhook", { meeting_id });
export const exportMarkdown = (meeting_id: string) => invoke<string>("export_markdown", { meeting_id });
export const saveAttachmentText = (meeting_id: string, filename: string, extracted_text: string) =>
  invoke<void>("save_attachment_text", { meeting_id, filename, extracted_text });
export const createFolder = (name: string) => invoke<Folder>("create_folder", { name });
export const saveCustomTemplate = (name: string, prompt_template: string, structure_json: string) =>
  invoke<void>("save_custom_template", { name, prompt_template, structure_json });
