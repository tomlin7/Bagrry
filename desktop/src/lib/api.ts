import { invoke } from "@tauri-apps/api/core";
import type {
  ActionItem,
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
  invoke<Meeting[]>("list_meetings", { folderId: folderId ?? null });
export const getMeeting = (id: string) => invoke<Meeting>("get_meeting", { id });
export const listFolders = () => invoke<Folder[]>("list_folders");
export const listTemplates = () => invoke<Template[]>("list_templates");
export const listRecipes = () => invoke<Recipe[]>("list_recipes");
export const dbStatus = () => invoke<DbStatus>("db_status");
export const createMeeting = (title: string, folderId?: string | null) =>
  invoke<Meeting>("create_meeting", { title, folderId: folderId ?? null });
export const saveScratchpad = (id: string, scratchpadRaw: string) =>
  invoke<void>("save_scratchpad", { id, scratchpadRaw });
export const saveTitle = (id: string, title: string) => invoke<void>("save_title", { id, title });
export const startRecording = (meetingId?: string | null) =>
  invoke<RecStatus>("start_recording", { meetingId: meetingId ?? null });
export const stopRecording = () => invoke<RecStatus>("stop_recording");
export const pauseRecording = () => invoke<RecStatus>("pause_recording");
export const recordingStatus = () => invoke<RecStatus>("recording_status");
export const discardAudio = () => invoke<RecStatus>("discard_audio");
export const transcribePending = (meetingId: string) =>
  invoke<TranscriptSeg[]>("transcribe_pending", { meetingId });
export const listSegments = (meetingId: string) =>
  invoke<TranscriptSeg[]>("list_segments", { meetingId });
export const enhanceMeeting = (meetingId: string, templateId?: string | null) =>
  invoke<string>("enhance_meeting", { meetingId, templateId: templateId ?? null });
export const runRecipe = (meetingId: string, recipeId: string) =>
  invoke<string>("run_recipe", { meetingId, recipeId });
export const repromptSelection = (meetingId: string, selection: string, instruction: string) =>
  invoke<string>("reprompt_selection", { meetingId, selection, instruction });
export const askBagrry = (query: string, folderId?: string | null, meetingId?: string | null) =>
  invoke<string>("ask_bagrry", { query, folderId: folderId ?? null, meetingId: meetingId ?? null });
export const liveAsk = (query: string, liveTranscript: string) =>
  invoke<string>("live_ask", { query, liveTranscript });
export const searchMeetings = (query: string) => invoke<Meeting[]>("search_meetings", { query });
export const listPeople = () => invoke<Person[]>("list_people");
export const listCompanies = () => invoke<Company[]>("list_companies");
export const listActionItems = () => invoke<ActionItem[]>("list_action_items");
export const upsertPerson = (name: string, email?: string | null) =>
  invoke<Person>("upsert_person", { name, email: email ?? null });
export const meetingsForPerson = (personId: string) =>
  invoke<Meeting[]>("meetings_for_person", { personId });
export const listCalendar = () => invoke<CalendarEvent[]>("list_calendar");
export const upsertCalendarEvent = (title: string, startAt: string, attendeesJson?: string | null) =>
  invoke<CalendarEvent>("upsert_calendar_event", {
    title,
    startAt,
    attendeesJson: attendeesJson ?? null,
  });
export const preMeetingBrief = (attendeesJson: string) =>
  invoke<string>("pre_meeting_brief", { attendeesJson });
export const setSecret = (key: string, value: string) => invoke<void>("set_secret", { key, value });
export const setSetting = (key: string, value: string) => invoke<void>("set_setting", { key, value });
export const getSetting = (key: string) => invoke<string>("get_setting", { key });
export const copyConsent = () => invoke<string>("copy_consent");
export const createShare = (meetingId: string) => invoke<string>("create_share", { meetingId });
export const dispatchWebhook = (meetingId: string) => invoke<string>("dispatch_webhook", { meetingId });
export const exportMarkdown = (meetingId: string) => invoke<string>("export_markdown", { meetingId });
export const saveAttachmentText = (meetingId: string, filename: string, extractedText: string) =>
  invoke<void>("save_attachment_text", { meetingId, filename, extractedText });
export const createFolder = (name: string) => invoke<Folder>("create_folder", { name });
export const saveCustomTemplate = (name: string, promptTemplate: string, structureJson: string) =>
  invoke<void>("save_custom_template", { name, promptTemplate, structureJson });
