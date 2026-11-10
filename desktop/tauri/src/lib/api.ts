import { invoke } from "@tauri-apps/api/core";
import type {
  ActionItem,
  ApiKey,
  Attachment,
  AudioDeviceInfo,
  AudioDiagnostics,
  CalendarEvent,
  ChatMessage,
  ChatRole,
  ChatSession,
  Company,
  CompanyDossier,
  DbStatus,
  Folder,
  FormattedExport,
  GlobalSearchResult,
  LocalLlmStatus,
  LocalSttStatus,
  Meeting,
  MeetingAnalytics,
  Person,
  PersonDossier,
  Profile,
  Recipe,
  RecStatus,
  RetroBufferStatus,
  SecurityStatus,
  ShareInfo,
  Template,
  TranscriptSeg,
  VaultExportResult,
  BundleExportResult,
  BundleImportResult,
  DestinationResult,
  DispatchReport,
  DispatchRequest,
  LanguageInfo,
  PeerInfo,
  SemanticSearchResult,
  SubtitleEvent,
  VoiceMatchResult,
  VoiceProfileInfo,
  VisualFrame,
  CopilotFlashCard,
  DetectedTrigger,
  UpcomingMeetingEvent,
  MeetingBehavioralReport,
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
export const assignSpeakerName = (meetingId: string, speakerSource: string, speakerName: string) =>
  invoke<TranscriptSeg[]>("assign_speaker_name", { meetingId, speakerSource, speakerName });
export const updateSegmentSpeaker = (segmentId: string, speakerName?: string | null) =>
  invoke<void>("update_segment_speaker", { segmentId, speakerName: speakerName ?? null });

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
export const searchGlobal = (query: string) =>
  invoke<GlobalSearchResult>("search_global", { query });
export const listPeople = () => invoke<Person[]>("list_people");
export const getPersonDossier = (personId: string) =>
  invoke<PersonDossier>("get_person_dossier", { personId });
export const updatePerson = (payload: {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  companyName?: string | null;
  notes?: string | null;
  excluded?: boolean;
}) =>
  invoke<Person>("update_person", {
    id: payload.id,
    name: payload.name,
    email: payload.email ?? null,
    role: payload.role ?? null,
    companyName: payload.companyName ?? null,
    notes: payload.notes ?? null,
    excluded: payload.excluded ?? false,
  });
export const mergePeople = (primaryId: string, duplicateId: string) =>
  invoke<void>("merge_people", { primaryId, duplicateId });
export const deletePerson = (id: string) =>
  invoke<void>("delete_person", { id });
export const indexAllAttendees = () =>
  invoke<number>("index_all_attendees");
export const listCompanies = () => invoke<Company[]>("list_companies");
export const getCompanyDossier = (companyId: string) =>
  invoke<CompanyDossier>("get_company_dossier", { companyId });
export const updateCompany = (id: string, name: string, domain?: string | null) =>
  invoke<Company>("update_company", { id, name, domain: domain ?? null });
export const autoIndexCompanies = () =>
  invoke<number>("auto_index_companies");
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
export const saveCustomTemplate = (
  name: string,
  promptTemplate: string,
  structureJson: string,
  icon?: string | null,
) =>
  invoke<Template>("save_custom_template", {
    name,
    promptTemplate,
    structureJson,
    icon: icon ?? null,
  });
export const updateCustomTemplate = (
  id: string,
  name: string,
  promptTemplate: string,
  structureJson: string,
  icon?: string | null,
) =>
  invoke<void>("update_custom_template", {
    id,
    name,
    promptTemplate,
    structureJson,
    icon: icon ?? null,
  });
export const deleteCustomTemplate = (id: string) =>
  invoke<void>("delete_custom_template", { id });
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
export const createShareCustom = (payload: {
  meetingId: string;
  includeTranscript: boolean;
  includeAudio: boolean;
  includeScratchpad: boolean;
  expiresDays?: number | null;
}) =>
  invoke<ShareInfo>("create_share_custom", {
    meetingId: payload.meetingId,
    includeTranscript: payload.includeTranscript,
    includeAudio: payload.includeAudio,
    includeScratchpad: payload.includeScratchpad,
    expiresDays: payload.expiresDays ?? null,
  });
export const getMeetingShares = (meetingId: string) =>
  invoke<ShareInfo[]>("get_meeting_shares", { meetingId });
export const revokeShare = (token: string) =>
  invoke<void>("revoke_share", { token });
export const exportFormatted = (meetingId: string, format: string) =>
  invoke<FormattedExport>("export_formatted", { meetingId, format });
export const exportToNotion = (meetingId: string, targetParentId?: string | null) =>
  invoke<string>("export_to_notion", { meetingId, targetParentId: targetParentId ?? null });
export const verifyNotionConnection = (apiKey: string) =>
  invoke<string>("verify_notion_connection", { apiKey });
export const sendToSlack = (meetingId: string, webhookUrl?: string | null) =>
  invoke<string>("send_to_slack", { meetingId, webhookUrl: webhookUrl ?? null });
export const verifyTeamsWebhook = (webhookUrl: string) =>
  invoke<string>("verify_teams_webhook", { webhookUrl });
export const sendToTeams = (meetingId: string, webhookUrl?: string | null) =>
  invoke<string>("send_to_teams_webhook", { meetingId, webhookUrl: webhookUrl ?? null });
export const verifyDiscordWebhook = (webhookUrl: string) =>
  invoke<string>("verify_discord_webhook", { webhookUrl });
export const sendToDiscord = (meetingId: string, webhookUrl?: string | null) =>
  invoke<string>("send_to_discord_webhook", { meetingId, webhookUrl: webhookUrl ?? null });
export const verifyLinearConnection = (apiKey: string) =>
  invoke<string>("verify_linear_connection", { apiKey });
export const createLinearIssue = (title: string, description?: string | null, teamKey?: string | null) =>
  invoke<string>("create_linear_issue", { title, description: description ?? null, teamKey: teamKey ?? null });
export const dispatchWebhook = (meetingId: string) => invoke<string>("dispatch_webhook", { meetingId });
export const exportMarkdown = (meetingId: string) => invoke<string>("export_markdown", { meetingId });
export const listAttachments = (meetingId: string) =>
  invoke<Attachment[]>("list_attachments", { meetingId });
export const saveAttachmentText = (meetingId: string, filename: string, extractedText: string) =>
  invoke<void>("save_attachment_text", { meetingId, filename, extractedText });

/* ------------------------------------------------------------------ */
/* Functional settings                                                 */
/* ------------------------------------------------------------------ */

export const getLocalSttStatus = () => invoke<LocalSttStatus>("get_local_stt_status");
export const setLocalSttEngine = (engine: "local" | "cloud") =>
  invoke<void>("set_local_stt_engine", { engine });
export const setActiveLocalModel = (modelId: string) =>
  invoke<void>("set_active_local_model", { modelId });
export const setSttCloudFallback = (enable: boolean) =>
  invoke<void>("set_stt_cloud_fallback", { enable });
export const downloadLocalModel = (modelId: string) =>
  invoke<void>("download_local_model", { modelId });
export const deleteLocalModel = (modelId: string) =>
  invoke<void>("delete_local_model", { modelId });

export const getLocalLlmStatus = () => invoke<LocalLlmStatus>("get_local_llm_status");
export const setLocalLlmEngine = (engine: "local" | "cloud") =>
  invoke<void>("set_local_llm_engine", { engine });
export const setActiveLocalLlmModel = (modelId: string) =>
  invoke<void>("set_active_local_llm_model", { modelId });
export const setLlmCloudFallback = (enable: boolean) =>
  invoke<void>("set_llm_cloud_fallback", { enable });
export const downloadLocalLlmModel = (modelId: string) =>
  invoke<void>("download_local_llm_model", { modelId });
export const deleteLocalLlmModel = (modelId: string) =>
  invoke<void>("delete_local_llm_model", { modelId });
export const queryLocalLlm = (question: string, context: string, modelId?: string) =>
  invoke<string>("query_local_llm", { question, context, modelId: modelId ?? null });

export const getRetroBufferStatus = () => invoke<RetroBufferStatus>("get_retro_buffer_status");
export const startRetroactiveRecording = (meetingId?: string, durationSecs?: number) =>
  invoke<RecStatus>("start_retroactive_recording", {
    meetingId: meetingId ?? null,
    durationSecs: durationSecs ?? 300,
  });

export const getSecurityStatus = () => invoke<SecurityStatus>("get_security_status");
export const setDatabaseEncryption = (enabled: boolean) =>
  invoke<void>("set_database_encryption", { enabled });
export const rotateSecurityKey = () => invoke<string>("rotate_security_key");

export const setLaunchOnLogin = (enable: boolean) =>
  invoke<boolean>("set_launch_on_login", { enable });
export const getLaunchOnLogin = () => invoke<boolean>("get_launch_on_login");
export const applyRetention = () => invoke<number>("apply_retention");
export const exportCsv = () => invoke<string>("export_csv");
export const exportWorkspaceVault = (destinationPath?: string | null) =>
  invoke<VaultExportResult>("export_workspace_markdown_vault", { destinationPath: destinationPath ?? null });
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

export const listAudioDevices = () => invoke<AudioDeviceInfo[]>("list_audio_devices");
export const getAudioDiagnostics = () => invoke<AudioDiagnostics>("get_audio_diagnostics");
export const getMeetingAnalytics = () => invoke<MeetingAnalytics>("get_meeting_analytics");

export async function onVoiceCommand(
  cb: (payload: { command_type: string; payload: string; meeting_id?: string }) => void
): Promise<() => void> {
  if (typeof window === "undefined") return () => {};
  try {
    const { listen } = await import("@tauri-apps/api/event");
    const unlisten = await listen<{ command_type: string; payload: string; meeting_id?: string }>(
      "voice-command-detected",
      (event) => {
        cb(event.payload);
      }
    );
    return unlisten;
  } catch {
    return () => {};
  }
}

/* ------------------------------------------------------------------ */
/* Milestone 7: Voice Biometrics, Translation, Dispatch, Search, P2P   */
/* ------------------------------------------------------------------ */

export const enrollVoiceProfile = (personId: string, name: string, samplePcm?: number[]) =>
  invoke<VoiceProfileInfo>("enroll_voice_profile", { personId, name, samplePcm: samplePcm ?? null });
export const listVoiceProfiles = () => invoke<VoiceProfileInfo[]>("list_voice_profiles");
export const deleteVoiceProfile = (personId: string) =>
  invoke<void>("delete_voice_profile", { personId });
export const matchVoiceSample = (samplePcm: number[]) =>
  invoke<VoiceMatchResult | null>("match_voice_sample", { samplePcm });

export const getSupportedLanguages = () => invoke<LanguageInfo[]>("get_supported_languages");
export const getActiveTranslationLanguage = () =>
  invoke<string>("get_active_translation_language");
export const setActiveTranslationLanguage = (targetLang: string) =>
  invoke<void>("set_active_translation_language", { targetLang });
export const translateText = (text: string, targetLang: string) =>
  invoke<string>("translate_text", { text, targetLang });

export async function onSubtitle(cb: (event: SubtitleEvent) => void): Promise<() => void> {
  if (typeof window === "undefined") return () => {};
  try {
    const { listen } = await import("@tauri-apps/api/event");
    const unlisten = await listen<SubtitleEvent>("live-subtitle", (e) => cb(e.payload));
    return unlisten;
  } catch {
    return () => {};
  }
}

export const dispatchMeeting = (request: DispatchRequest) =>
  invoke<DispatchReport>("dispatch_meeting", { request });
export const getDispatchHistory = (meetingId: string) =>
  invoke<DestinationResult[]>("get_dispatch_history", { meetingId });

export const searchHybrid = (query: string, limit?: number) =>
  invoke<SemanticSearchResult[]>("search_hybrid", { query, limit: limit ?? null });
export const indexMeetingEmbeddings = (meetingId: string) =>
  invoke<number>("index_meeting_embeddings", { meetingId });

export const exportMeetingBundle = (meetingId: string, password?: string) =>
  invoke<BundleExportResult>("export_meeting_bundle", { meetingId, password: password ?? null });
export const importMeetingBundle = (bundlePath: string, password?: string) =>
  invoke<BundleImportResult>("import_meeting_bundle", { bundlePath, password: password ?? null });
export const listLocalPeers = () => invoke<PeerInfo[]>("list_local_peers");

/* ------------------------------------------------------------------ */
/* Milestone 8: Visual Perception, Copilot Agent & Behavioral Intel   */
/* ------------------------------------------------------------------ */

export const listVisualFrames = (meetingId: string) =>
  invoke<VisualFrame[]>("list_visual_frames", { meetingId });
export const saveVisualFrame = (
  meetingId: string,
  timestampMs: number,
  ocrText: string,
  slideTitle?: string,
  thumbnailPath?: string,
) =>
  invoke<VisualFrame>("save_visual_frame", {
    meetingId,
    timestampMs,
    ocrText,
    slideTitle: slideTitle ?? null,
    thumbnailPath: thumbnailPath ?? null,
  });
export const deleteVisualFrame = (frameId: string) =>
  invoke<void>("delete_visual_frame", { frameId });

export const listCopilotFlashCards = (meetingId: string) =>
  invoke<CopilotFlashCard[]>("list_copilot_flash_cards", { meetingId });
export const createCopilotFlashCard = (
  meetingId: string,
  triggerText: string,
  sourceType: string,
  title: string,
  snippet: string,
  url?: string,
) =>
  invoke<CopilotFlashCard>("create_copilot_flash_card", {
    meetingId,
    triggerText,
    sourceType,
    title,
    snippet,
    url: url ?? null,
  });
export const dismissCopilotFlashCard = (cardId: string) =>
  invoke<void>("dismiss_copilot_flash_card", { cardId });
export const detectCopilotTriggers = (utterance: string) =>
  invoke<DetectedTrigger[]>("detect_copilot_triggers", { utterance });

export const listUpcomingCalendarEvents = () =>
  invoke<UpcomingMeetingEvent[]>("list_upcoming_calendar_events");

export const getBehavioralAnalytics = (meetingId: string) =>
  invoke<MeetingBehavioralReport>("get_behavioral_analytics", { meetingId });

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
  meetingShares: (id: string) => ["meeting-shares", id] as const,
  segments: (id: string) => ["segments", id] as const,
  attendees: (id: string) => ["attendees", id] as const,
  attachments: (id: string) => ["attachments", id] as const,
  folders: () => ["folders"] as const,
  templates: () => ["templates"] as const,
  recipes: () => ["recipes"] as const,
  people: () => ["people"] as const,
  personDossier: (id: string) => ["person-dossier", id] as const,
  companies: () => ["companies"] as const,
  companyDossier: (id: string) => ["company-dossier", id] as const,
  calendar: () => ["calendar"] as const,
  actionItems: () => ["action-items"] as const,
  chatSessions: () => ["chat-sessions"] as const,
  chatMessages: (id: string) => ["chat-messages", id] as const,
  search: (query: string) => ["search", query] as const,
  searchGlobal: (query: string) => ["search-global", query] as const,
  dbStatus: () => ["db-status"] as const,
  profile: () => ["profile"] as const,
  settings: (keys: string[]) => ["settings", ...keys] as const,
  apiKeys: () => ["api-keys"] as const,
  referral: () => ["referral"] as const,
  autostart: () => ["autostart"] as const,
  localSttStatus: () => ["local-stt-status"] as const,
  localLlmStatus: () => ["local-llm-status"] as const,
  retroBuffer: () => ["retro-buffer-status"] as const,
  securityStatus: () => ["security-status"] as const,
  audioDevices: () => ["audio-devices"] as const,
  audioDiagnostics: () => ["audio-diagnostics"] as const,
  analytics: () => ["analytics"] as const,
  voiceProfiles: () => ["voice-profiles"] as const,
  translationLanguages: () => ["translation-languages"] as const,
  activeTranslationLang: () => ["active-translation-lang"] as const,
  dispatchHistory: (id: string) => ["dispatch-history", id] as const,
  semanticSearch: (query: string) => ["semantic-search", query] as const,
  localPeers: () => ["local-peers"] as const,
  visualFrames: (id: string) => ["visual-frames", id] as const,
  copilotFlashCards: (id: string) => ["copilot-flash-cards", id] as const,
  upcomingEvents: () => ["upcoming-events"] as const,
  behavioralAnalytics: (id: string) => ["behavioral-analytics", id] as const,
};
