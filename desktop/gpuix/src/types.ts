export type Speaker = 'me' | 'attendees'

export type RecState = 'idle' | 'recording' | 'paused'

export interface RecStatus {
  state: RecState
  pendingBytes: number
  loopbackOk: boolean
  meetingId: string | null
  lastError: string | null
}

export interface VuLevels {
  mic: number
  system: number
}

export interface Folder {
  id: string
  parent_id: string | null
  name: string
  is_shared: boolean
  icon: string | null
  description: string | null
}

export interface Bullet {
  text: string
  citations: string[]
}

export interface Section {
  section_title: string
  bullet_points: Bullet[]
}

export interface EnhancedDoc {
  sections: Section[]
}

export interface TranscriptSeg {
  id: string
  speaker: Speaker | string
  start_ms: number
  end_ms: number
  text: string
  sentence_index: number
  sentence_id: string
}

export interface Meeting {
  id: string
  folder_id: string | null
  title: string
  date: string
  duration_ms: number | null
  calendar_event_id: string | null
  scratchpad_raw: string
  scratchpad_json: string | null
  enhanced_notes_json: string | null
  transcript_json: string | null
  updated_at: string
}

export interface Template {
  id: string
  name: string
  icon: string | null
  prompt_template: string
  structure_json: string | null
}

export interface Recipe {
  id: string
  name: string
  icon: string | null
  prompt_template: string
}

export interface Person {
  id: string
  name: string
  email: string | null
  domain: string | null
  company_id: string | null
  note_count: number
  last_note_at: string | null
  is_me?: boolean
}

export interface Company {
  id: string
  name: string
  domain: string | null
  note_count: number
  last_note_at: string | null
}

export interface CalendarEvent {
  id: string
  title: string
  start_at: string
  end_at: string | null
  attendees_json: string | null
}

export interface ActionItem {
  id: string
  meeting_id: string
  meeting_title: string
  owner: string | null
  task: string
  deadline: string | null
  done: boolean
}

export interface ChatSession {
  id: string
  title: string
  space_id: string | null
  created_at: string
  updated_at: string
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  session_id: string
  role: ChatRole
  content: string
  created_at: string
}

export interface Profile {
  name: string
  email: string
  workspace: string
}

export const MY_NOTES_SPACE = 'my-notes'
export const TEAM_SPACE = 'team'

export type SettingsTab =
  | 'preferences'
  | 'profile'
  | 'calendar'
  | 'notifications'
  | 'connectors'
  | 'help'
  | 'workspace-general'
  | 'members'
  | 'spaces'
  | 'analytics'
  | 'billing'
  | 'referrals'

export type Route =
  | { kind: 'home' }
  | { kind: 'shared' }
  | { kind: 'chat'; sessionId: string | null }
  | { kind: 'space'; spaceId: string }
  | { kind: 'note'; noteId: string }
  | { kind: 'people' }
  | { kind: 'companies' }
  | { kind: 'settings'; tab: SettingsTab }

export function routeKey(route: Route): string {
  switch (route.kind) {
    case 'chat':
      return `chat:${route.sessionId ?? 'new'}`
    case 'space':
      return `space:${route.spaceId}`
    case 'note':
      return `note:${route.noteId}`
    case 'settings':
      return `settings:${route.tab}`
    default:
      return route.kind
  }
}

export interface ApiKeyItem {
  id: string
  label: string
  kind: 'personal' | 'workspace'
  token: string
  created_at: string
}

export interface FeedbackItem {
  id: string
  kind: 'problem' | 'feature'
  body: string
  created_at: string
}

