import { invoke } from "@tauri-apps/api/core";
import type {
  ActionItem,
  ApiKey,
  Attachment,
  CalendarEvent,
  ChatMessage,
  ChatRole,
  ChatSession,
  Company,
  DbStatus,
  Folder,
  Meeting,
  Person,
  Profile,
  Recipe,
  RecStatus,
  Template,
  TranscriptSeg,
} from "./types";

/* ------------------------------------------------------------------ */
/* Notes & folders                                                     */
/* ------------------------------------------------------------------ */

export const listMeetings = (folderId?: string | null) =>
  invoke<Meeting[]>("list_meetings", { folderId: folderId ?? null });
export const getMeeting = (id: string) => invoke<Meeting>("get_meeting", { id });
export const createMeeting = (title: string, folderId?: string | null) =>
  invoke<Meeting>("create_meeting", { title, folderId: folderId ?? null });
export const saveScratchpad = (id: string, scratchpadRaw: string, scratchpadJson?: string | null) =>
  invoke<void>("save_scratchpad", { id, scratchpadRaw, scratchpadJson: scratchpadJson ?? null });
export const saveEnhancedNotes = (id: string, enhancedNotesJson: string) =>
  invoke<void>("save_enhanced_notes", { id, enhancedNotesJson });
export const saveTitle = (id: string, title: string) => invoke<void>("save_title", { id, title });
export const deleteMeeting = (id: string) => invoke<void>("delete_meeting", { id });
export const moveMeeting = (id: string, folderId?: string | null) =>
  invoke<void>("move_meeting", { id, folderId: folderId ?? null });
export const duplicateMeeting = (id: string) => invoke<Meeting>("duplicate_meeting", { id });

export const listFolders = () => invoke<Folder[]>("list_folders");
export const createFolder = (
  name: string,
  isShared = false,
  extras?: { icon?: string | null; description?: string | null },
) =>
  invoke<Folder>("create_folder", {
    name,
    isShared,
    icon: extras?.icon ?? null,
    description: extras?.description ?? null,
  });
export const renameFolder = (id: string, name: string) => invoke<void>("rename_folder", { id, name });
export const deleteFolder = (id: string) => invoke<void>("delete_folder", { id });
export const setFolderShared = (id: string, isShared: boolean) =>
  invoke<void>("set_folder_shared", { id, isShared });

/* ------------------------------------------------------------------ */
/* Recording & transcription                                           */
/* ------------------------------------------------------------------ */

export const startRecording = (meetingId?: string | null) =>
  invoke<RecStatus>("start_recording", { meetingId: meetingId ?? null });
export const stopRecording = () => invoke<RecStatus>("stop_recording");
export const pauseRecording = () => invoke<RecStatus>("pause_recording");
export const toggleRecording = () => invoke<RecStatus>("toggle_recording");
export const recordingStatus = () => invoke<RecStatus>("recording_status");
export const discardAudio = () => invoke<RecStatus>("discard_audio");
export const transcribePending = (meetingId: string) =>
  invoke<TranscriptSeg[]>("transcribe_pending", { meetingId });
export const listSegments = (meetingId: string) =>
  invoke<TranscriptSeg[]>("list_segments", { meetingId });

/* ------------------------------------------------------------------ */
/* AI                                                                  */
/* ------------------------------------------------------------------ */

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
export const preMeetingBrief = (attendeesJson: string) =>
  invoke<string>("pre_meeting_brief", { attendeesJson });

/* ------------------------------------------------------------------ */
/* Chat sessions                                                       */
/* ------------------------------------------------------------------ */

export const listChatSessions = () => invoke<ChatSession[]>("list_chat_sessions");
export const createChatSession = (title: string, spaceId?: string | null) =>
  invoke<ChatSession>("create_chat_session", { title, spaceId: spaceId ?? null });
export const renameChatSession = (id: string, title: string) =>
  invoke<void>("rename_chat_session", { id, title });
export const deleteChatSession = (id: string) => invoke<void>("delete_chat_session", { id });
export const listChatMessages = (sessionId: string) =>
  invoke<ChatMessage[]>("list_chat_messages", { sessionId });
export const appendChatMessage = (sessionId: string, role: ChatRole, content: string) =>
  invoke<ChatMessage>("append_chat_message", { sessionId, role, content });

/* ------------------------------------------------------------------ */
/* Search & directory                                                  */
/* ------------------------------------------------------------------ */

export const searchMeetings = (query: string) => invoke<Meeting[]>("search_meetings", { query });
export const listPeople = () => invoke<Person[]>("list_people");
export const listCompanies = () => invoke<Company[]>("list_companies");
export const upsertPerson = (name: string, email?: string | null) =>
  invoke<Person>("upsert_person", { name, email: email ?? null });
export const meetingsForPerson = (personId: string) =>
  invoke<Meeting[]>("meetings_for_person", { personId });
export const listMeetingAttendees = (meetingId: string) =>
  invoke<Person[]>("list_meeting_attendees", { meetingId });
export const addMeetingAttendee = (meetingId: string, personId: string) =>
  invoke<void>("add_meeting_attendee", { meetingId, personId });

/* ------------------------------------------------------------------ */
/* Calendar & actions                                                  */
/* ------------------------------------------------------------------ */

export const listCalendar = () => invoke<CalendarEvent[]>("list_calendar");
export const upsertCalendarEvent = (title: string, startAt: string, attendeesJson?: string | null) =>
  invoke<CalendarEvent>("upsert_calendar_event", { title, startAt, attendeesJson: attendeesJson ?? null });
export const listActionItems = () => invoke<ActionItem[]>("list_action_items");
export const addActionItem = (
  meetingId: string,
  task: string,
  owner?: string | null,
  deadline?: string | null,
) => invoke<ActionItem>("add_action_item", { meetingId, task, owner: owner ?? null, deadline: deadline ?? null });
export const setActionItemDone = (id: string, done: boolean) =>
  invoke<void>("set_action_item_done", { id, done });
export const deleteActionItem = (id: string) => invoke<void>("delete_action_item", { id });
export const importIcs = (content: string) => invoke<number>("import_ics", { content });
export const resetCalendar = () => invoke<void>("reset_calendar");

/* ------------------------------------------------------------------ */
/* Templates & recipes                                                 */
/* ------------------------------------------------------------------ */

export const listTemplates = () => invoke<Template[]>("list_templates");
export const listRecipes = () => invoke<Recipe[]>("list_recipes");
export const saveCustomTemplate = (name: string, promptTemplate: string, structureJson: string) =>
  invoke<void>("save_custom_template", { name, promptTemplate, structureJson });
export const saveCustomRecipe = (name: string, promptTemplate: string) =>
  invoke<void>("save_custom_recipe", { name, promptTemplate });

/* ------------------------------------------------------------------ */
/* Settings, secrets & sharing                                         */
/* ------------------------------------------------------------------ */

export const dbStatus = () => invoke<DbStatus>("db_status");
export const setSecret = (key: string, value: string) => invoke<void>("set_secret", { key, value });
export const setSetting = (key: string, value: string) => invoke<void>("set_setting", { key, value });
export const getSetting = (key: string) => invoke<string>("get_setting", { key });
export const getSettings = (keys: string[]) => invoke<Record<string, string>>("get_settings", { keys });
export const getProfile = () => invoke<Profile>("get_profile");
export const setProfile = (name: string, email: string, workspace: string) =>
  invoke<void>("set_profile", { name, email, workspace });
export const copyConsent = () => invoke<string>("copy_consent");
export const createShare = (meetingId: string, visibility?: string | null) =>
  invoke<string>("create_share", { meetingId, visibility: visibility ?? null });
export const dispatchWebhook = (meetingId: string) => invoke<string>("dispatch_webhook", { meetingId });
export const exportMarkdown = (meetingId: string) => invoke<string>("export_markdown", { meetingId });
export const listAttachments = (meetingId: string) =>
  invoke<Attachment[]>("list_attachments", { meetingId });
export const saveAttachmentText = (meetingId: string, filename: string, extractedText: string) =>
  invoke<void>("save_attachment_text", { meetingId, filename, extractedText });

/* ------------------------------------------------------------------ */
/* Functional settings                                                 */
/* ------------------------------------------------------------------ */

export const setLaunchOnLogin = (enable: boolean) =>
  invoke<boolean>("set_launch_on_login", { enable });
export const getLaunchOnLogin = () => invoke<boolean>("get_launch_on_login");
export const applyRetention = () => invoke<number>("apply_retention");
export const exportCsv = () => invoke<string>("export_csv");
export const importNotes = (notes: { title: string; body: string; date?: string | null }[]) =>
  invoke<number>("import_notes", { notes });
export const deleteAllData = () => invoke<void>("delete_all_data");
export const listApiKeys = () => invoke<ApiKey[]>("list_api_keys");
export const createApiKey = (label: string, kind: "personal" | "workspace") =>
  invoke<string>("create_api_key", { label, kind });
export const revokeApiKey = (id: string) => invoke<void>("revoke_api_key", { id });
export const submitFeedback = (category: string, content: string) =>
  invoke<void>("submit_feedback", { category, content });
export const getReferralCode = () => invoke<string>("get_referral_code");

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

/**
 * Single source of truth for React Query cache keys. Every hook and every
 * invalidation reads from here so a rename can't leave a stale list behind.
 */
export const qk = {
  meetings: (folderId?: string | null) => ["meetings", folderId ?? "all"] as const,
  meeting: (id: string) => ["meeting", id] as const,
  segments: (id: string) => ["segments", id] as const,
  attendees: (id: string) => ["attendees", id] as const,
  attachments: (id: string) => ["attachments", id] as const,
  folders: () => ["folders"] as const,
  templates: () => ["templates"] as const,
  recipes: () => ["recipes"] as const,
  people: () => ["people"] as const,
  companies: () => ["companies"] as const,
  calendar: () => ["calendar"] as const,
  actionItems: () => ["action-items"] as const,
  chatSessions: () => ["chat-sessions"] as const,
  chatMessages: (id: string) => ["chat-messages", id] as const,
  search: (query: string) => ["search", query] as const,
  dbStatus: () => ["db-status"] as const,
  profile: () => ["profile"] as const,
  settings: (keys: string[]) => ["settings", ...keys] as const,
  apiKeys: () => ["api-keys"] as const,
  referral: () => ["referral"] as const,
  autostart: () => ["autostart"] as const,
};
