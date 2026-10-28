import { create } from 'zustand'
import {
  type ActionItem,
  type CalendarEvent,
  type ChatMessage,
  type ChatSession,
  type Company,
  type EnhancedDoc,
  type Folder,
  type Meeting,
  type Person,
  type Profile,
  type Recipe,
  type RecState,
  type Route,
  type SettingsTab,
  type Template,
  type TranscriptSeg,
  type VuLevels,
  MY_NOTES_SPACE,
  routeKey,
} from '../types'
import { DARK_THEME, LIGHT_THEME, type BagrryColors } from '../theme'

const SEED_FOLDERS: Folder[] = [
  { id: 'fld_roadmap', parent_id: null, name: 'Product Roadmap', is_shared: false, icon: 'map', description: 'Q3 & Q4 product initiatives and feature specs' },
  { id: 'fld_research', parent_id: null, name: 'User Research', is_shared: false, icon: 'search', description: 'Customer interviews and usability testing' },
  { id: 'fld_sync', parent_id: null, name: 'Team Syncs', is_shared: true, icon: 'users', description: 'Weekly engineering & cross-functional all-hands' },
  { id: 'fld_design', parent_id: null, name: 'Design Reviews', is_shared: true, icon: 'palette', description: 'Critiques, wireframes, and design system audits' },
]

const SEED_PEOPLE: Person[] = [
  { id: 'usr_me', name: 'Alex Rivera', email: 'alex@bagrry.dev', domain: 'bagrry.dev', company_id: 'cmp_bagrry', note_count: 8, last_note_at: '2026-10-28T14:30:00Z', is_me: true },
  { id: 'usr_sarah', name: 'Sarah Chen', email: 'sarah@vertex.io', domain: 'vertex.io', company_id: 'cmp_vertex', note_count: 5, last_note_at: '2026-10-28T11:00:00Z' },
  { id: 'usr_marcus', name: 'Marcus Brody', email: 'marcus@helix.co', domain: 'helix.co', company_id: 'cmp_helix', note_count: 3, last_note_at: '2026-10-27T16:00:00Z' },
  { id: 'usr_elena', name: 'Elena Rostova', email: 'elena@bagrry.dev', domain: 'bagrry.dev', company_id: 'cmp_bagrry', note_count: 6, last_note_at: '2026-10-26T10:00:00Z' },
  { id: 'usr_devon', name: 'Devon Vance', email: 'devon@acme.corp', domain: 'acme.corp', company_id: 'cmp_acme', note_count: 2, last_note_at: '2026-10-25T15:30:00Z' },
]

const SEED_COMPANIES: Company[] = [
  { id: 'cmp_bagrry', name: 'Bagrry Labs', domain: 'bagrry.dev', note_count: 14, last_note_at: '2026-10-28T14:30:00Z' },
  { id: 'cmp_vertex', name: 'Vertex Systems', domain: 'vertex.io', note_count: 5, last_note_at: '2026-10-28T11:00:00Z' },
  { id: 'cmp_helix', name: 'Helix AI', domain: 'helix.co', note_count: 3, last_note_at: '2026-10-27T16:00:00Z' },
  { id: 'cmp_acme', name: 'Acme Enterprises', domain: 'acme.corp', note_count: 2, last_note_at: '2026-10-25T15:30:00Z' },
]

const SEED_CALENDAR: CalendarEvent[] = [
  {
    id: 'cal_1',
    title: 'Design Critique & GPUI Migration Sync',
    start_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    end_at: new Date(Date.now() + 45 * 60_000).toISOString(),
    attendees_json: JSON.stringify(['Sarah Chen', 'Elena Rostova']),
  },
  {
    id: 'cal_2',
    title: 'Customer Onboarding: Vertex Systems',
    start_at: new Date(Date.now() + 120 * 60_000).toISOString(),
    end_at: new Date(Date.now() + 165 * 60_000).toISOString(),
    attendees_json: JSON.stringify(['Marcus Brody', 'Devon Vance']),
  },
  {
    id: 'cal_3',
    title: 'Weekly All-Hands & Product Demo',
    start_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
    end_at: new Date(Date.now() + 25 * 3600_000).toISOString(),
    attendees_json: JSON.stringify(['Whole Team']),
  },
]

export const SEED_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act_1',
    meeting_id: 'note_roadmap_sync',
    meeting_title: 'Q4 Product Roadmap Sync',
    owner: 'Alex Rivera',
    task: 'Finalize GPUI migration benchmark numbers for the executive deck',
    deadline: '2026-10-30',
    done: false,
  },
  {
    id: 'act_2',
    meeting_id: 'note_vertex_pilot',
    meeting_title: 'Vertex Systems Technical Deep Dive',
    owner: 'Sarah Chen',
    task: 'Share webhook API specifications and latency requirements',
    deadline: '2026-10-29',
    done: false,
  },
  {
    id: 'act_3',
    meeting_id: 'note_research_interviews',
    meeting_title: 'User Interview #4 — Enterprise Knowledge Workers',
    owner: 'Elena Rostova',
    task: 'Transcribe audio recording and synthesize citation tags',
    deadline: '2026-11-02',
    done: false,
  },
]

const SAMPLE_ENHANCED_DOC: EnhancedDoc = {
  sections: [
    {
      section_title: 'Executive Summary',
      bullet_points: [
        { text: 'Agreed to transition from Webview/Tauri architecture to native GPUIX rendering to eliminate memory overhead and achieve zero-latency window dragging.', citations: ['seg_1'] },
        { text: 'Confirmed Q4 release timeline with public beta slated for late November.', citations: ['seg_2'] },
      ],
    },
    {
      section_title: 'Architecture & Performance Decisions',
      bullet_points: [
        { text: 'Win32 borderless window dragging will utilize user32.dll FFI handoff to ensure full native Aero Snap support.', citations: ['seg_3'] },
        { text: 'Audio recording will leverage WASAPI loopback capture on Windows with instantaneous VU meter updates.', citations: ['seg_4'] },
        { text: 'All state persistence remains entirely on-device, preserving zero-cloud confidentiality for all user transcripts.', citations: ['seg_2'] },
      ],
    },
    {
      section_title: 'Next Actions',
      bullet_points: [
        { text: 'Alex to compile benchmark comparisons of GPUI vs Tauri startup latency and frame times.', citations: ['seg_4'] },
        { text: 'Sarah to review the design tokens to guarantee 1:1 parity with the warm paper aesthetics.', citations: ['seg_3'] },
      ],
    },
  ],
}

const SEED_MEETINGS: Meeting[] = [
  {
    id: 'note_roadmap_sync',
    folder_id: 'fld_roadmap',
    title: 'Q4 Product Roadmap & Native Architecture Sync',
    date: '2026-10-28T14:30:00Z',
    duration_ms: 1845000,
    calendar_event_id: 'cal_1',
    scratchpad_raw: 'Discussion on porting Bagrry from Tauri to GPUI.\n- Zero-latency GPU rendering\n- 46x32 Windows 11 caption controls\n- Warm paper color theme (#252523 background)\n- Retain all on-device SQLite storage and AI summarization pipelines\n- Next release target: v0.22',
    scratchpad_json: null,
    enhanced_notes_json: JSON.stringify(SAMPLE_ENHANCED_DOC),
    transcript_json: null,
    updated_at: '2026-10-28T15:00:00Z',
  },
  {
    id: 'note_vertex_pilot',
    folder_id: 'fld_sync',
    title: 'Vertex Systems Technical Deep Dive',
    date: '2026-10-28T11:00:00Z',
    duration_ms: 2400000,
    calendar_event_id: 'cal_2',
    scratchpad_raw: 'Sarah Chen and Marcus Brody joined from Vertex Systems.\nCovered their multi-speaker diarization setup, offline transcription requirements, and custom prompt templates.',
    scratchpad_json: null,
    enhanced_notes_json: null,
    transcript_json: null,
    updated_at: '2026-10-28T11:45:00Z',
  },
  {
    id: 'note_research_interviews',
    folder_id: 'fld_research',
    title: 'User Interview #4 — Enterprise Knowledge Workers',
    date: '2026-10-27T16:00:00Z',
    duration_ms: 2700000,
    calendar_event_id: null,
    scratchpad_raw: 'Feedback regarding floating transcript panel.\nUsers love the minimized pill mode with real-time elapsed counter and instant copy button.',
    scratchpad_json: null,
    enhanced_notes_json: null,
    transcript_json: null,
    updated_at: '2026-10-27T16:50:00Z',
  },
  {
    id: 'note_design_critique',
    folder_id: 'fld_design',
    title: 'Design System Polish: Warm Paper & Electric Lime',
    date: '2026-10-26T10:00:00Z',
    duration_ms: 1500000,
    calendar_event_id: null,
    scratchpad_raw: 'Audited border radiuses, button states, and font choices.\n- Display font: Playfair / Georgia serif for headers\n- Solid action button: #ededea with #1c1b19 text\n- Accent highlight: #c3dd4f chartreuse',
    scratchpad_json: null,
    enhanced_notes_json: null,
    transcript_json: null,
    updated_at: '2026-10-26T10:30:00Z',
  },
]

const SEED_SEGMENTS: TranscriptSeg[] = [
  { id: 'seg_1', speaker: 'me', start_ms: 12000, end_ms: 24000, text: 'Welcome everyone. Today our primary agenda is finalizing the transition from webview to native GPU rendering for Bagrry desktop.', sentence_index: 0, sentence_id: 'seg_1' },
  { id: 'seg_2', speaker: 'Sarah Chen', start_ms: 25000, end_ms: 41000, text: 'Our users in Vertex have emphasized that offline privacy is imperative. Everything captured locally must remain on device unless explicitly exported.', sentence_index: 1, sentence_id: 'seg_2' },
  { id: 'seg_3', speaker: 'me', start_ms: 42000, end_ms: 58000, text: 'Completely agree. With GPUIX, window dragging is instantaneous via Win32 FFI, and the entire interface renders directly via DirectX/Metal with zero memory bloat.', sentence_index: 2, sentence_id: 'seg_3' },
  { id: 'seg_4', speaker: 'Marcus Brody', start_ms: 59000, end_ms: 78000, text: 'The dual microphone and system audio VU meters provide immediate visual feedback so attendees always know recording is functioning reliably.', sentence_index: 3, sentence_id: 'seg_4' },
]

const SEED_RECIPES: Recipe[] = [
  { id: 'rcp_summary', name: 'Summarise', icon: 'sparkles', prompt_template: 'Provide a concise 3-bullet summary with primary takeaways and key decisions.' },
  { id: 'rcp_email', name: 'Follow-up email', icon: 'send', prompt_template: 'Draft a polite follow-up email addressed to all attendees highlighting action items.' },
  { id: 'rcp_actions', name: 'Extract action items', icon: 'check-square', prompt_template: 'Extract every action item, owner, and implied deadline into a checklist.' },
]

const SEED_CHAT_SESSIONS: ChatSession[] = [
  { id: 'chat_1', title: 'Decisions from Q4 Roadmap Sync', space_id: null, created_at: '2026-10-28T15:10:00Z', updated_at: '2026-10-28T15:15:00Z' },
  { id: 'chat_2', title: 'Vertex Systems API Integration', space_id: null, created_at: '2026-10-27T17:00:00Z', updated_at: '2026-10-27T17:20:00Z' },
]

const SEED_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  chat_1: [
    { id: 'msg_1', session_id: 'chat_1', role: 'user', content: 'What were the core architectural decisions made in today’s roadmap sync?', created_at: '2026-10-28T15:10:00Z' },
    { id: 'msg_2', session_id: 'chat_1', role: 'assistant', content: 'Based on the **Q4 Product Roadmap & Native Architecture Sync**:\n\n1. **Native GPUIX Rendering Engine**: Porting completely from Tauri to GPUIX to achieve zero-latency window dragging, native Aero Snap, and reduced memory footprint.\n2. **100% On-Device Confidentiality**: Transcripts and recordings remain securely stored on the local machine.\n3. **Windows 11 Caption Controls**: Incorporating standard 46×32 caption buttons for seamless integration with the host OS.', created_at: '2026-10-28T15:11:00Z' },
  ],
}

interface BagrryStore {
  /* Navigation */
  route: Route
  history: Route[]
  navigate: (route: Route, options?: { replace?: boolean }) => void
  back: () => void
  openNote: (id: string) => void
  openSpace: (id: string) => void
  openSettings: (tab?: SettingsTab) => void

  /* Chrome */
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
  onboardingOpen: boolean
  finishOnboarding: () => void
  folderModal: { open: boolean; shared: boolean } | null
  openFolderModal: (shared: boolean) => void
  closeFolderModal: () => void

  /* Theme */
  themePreference: 'dark' | 'light' | 'system'
  colors: BagrryColors
  setThemePreference: (pref: 'dark' | 'light' | 'system') => void

  /* Data */
  profile: Profile
  folders: Folder[]
  meetings: Meeting[]
  calendarEvents: CalendarEvent[]
  actionItems: ActionItem[]
  people: Person[]
  companies: Company[]
  recipes: Recipe[]
  chatSessions: ChatSession[]
  chatMessages: Record<string, ChatMessage[]>
  settings: Record<string, string>

  /* Recording */
  recState: RecState
  recordingMeetingId: string | null
  recordingStartedAt: number | null
  vu: VuLevels
  liveSegments: TranscriptSeg[]
  transcriptOpen: boolean
  transcriptMinimized: boolean
  setTranscriptOpen: (open: boolean) => void
  setTranscriptMinimized: (minimized: boolean) => void
  startRecording: (meetingId?: string | null) => void
  pauseRecording: () => void
  stopRecording: () => void
  discardAudio: () => void

  /* Mutations */
  createMeeting: (title?: string, folderId?: string | null) => Meeting
  deleteMeeting: (id: string) => void
  duplicateMeeting: (id: string) => Meeting
  saveTitle: (id: string, title: string) => void
  saveScratchpad: (id: string, raw: string, json?: string | null) => void
  saveEnhancedNotes: (id: string, enhancedJson: string) => void
  moveMeeting: (id: string, folderId: string | null) => void
  enhanceMeeting: (id: string) => Promise<void>
  createFolder: (name: string, isShared: boolean) => Folder
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  toggleActionItem: (id: string) => void
  addActionItem: (meetingId: string, task: string, owner?: string, deadline?: string | null) => void
  deleteActionItem: (id: string) => void
  addPerson: (name: string, email?: string) => Person
  addCompany: (name: string, domain?: string) => Company
  sendChatMessage: (sessionId: string | null, content: string) => Promise<string>
  createChatSession: (title: string) => ChatSession
  deleteChatSession: (id: string) => void
  setSetting: (key: string, value: string) => void
}

let recInterval: any = null
let entitySeq = 0

export const useBagrryStore = create<BagrryStore>((set, get) => ({
  route: { kind: 'home' },
  history: [],

  navigate: (route, options) => {
    const current = get().route
    if (routeKey(current) === routeKey(route)) return
    set({
      route,
      history: options?.replace ? get().history : [...get().history, current].slice(-50),
    })
  },

  back: () => {
    const history = get().history
    if (history.length === 0) {
      set({ route: { kind: 'home' } })
      return
    }
    set({ route: history[history.length - 1], history: history.slice(0, -1) })
  },

  openNote: (id) => get().navigate({ kind: 'note', noteId: id }),
  openSpace: (id) => get().navigate({ kind: 'space', spaceId: id || MY_NOTES_SPACE }),
  openSettings: (tab = 'preferences') => {
    if (!get().sidebarOpen) get().setSidebarOpen(true)
    get().navigate({ kind: 'settings', tab })
  },

  sidebarOpen: true,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  onboardingOpen: false,
  finishOnboarding: () => set({ onboardingOpen: false }),

  folderModal: null,
  openFolderModal: (shared) => set({ folderModal: { open: true, shared } }),
  closeFolderModal: () => set({ folderModal: null }),

  themePreference: 'dark',
  colors: DARK_THEME,
  setThemePreference: (pref) => {
    const isDark = pref === 'dark' || (pref === 'system' && true)
    set({
      themePreference: pref,
      colors: isDark ? DARK_THEME : LIGHT_THEME,
    })
  },

  profile: {
    name: 'Alex Rivera',
    email: 'alex@bagrry.dev',
    workspace: 'Bagrry Labs',
  },
  folders: SEED_FOLDERS,
  meetings: SEED_MEETINGS,
  calendarEvents: SEED_CALENDAR,
  actionItems: SEED_ACTION_ITEMS,
  people: SEED_PEOPLE,
  companies: SEED_COMPANIES,
  recipes: SEED_RECIPES,
  chatSessions: SEED_CHAT_SESSIONS,
  chatMessages: SEED_CHAT_MESSAGES,
  settings: {
    transcription_language: 'en-best',
    calendar_primary_visible: '1',
    calendar_show_empty_events: '1',
    speaker_tags: '1',
    suggested_follow_up_emails: '1',
  },

  recState: 'idle',
  recordingMeetingId: null,
  recordingStartedAt: null,
  vu: { mic: 0, system: 0 },
  liveSegments: SEED_SEGMENTS,
  transcriptOpen: false,
  transcriptMinimized: false,
  setTranscriptOpen: (transcriptOpen) => set({ transcriptOpen }),
  setTranscriptMinimized: (transcriptMinimized) => set({ transcriptMinimized }),

  startRecording: (meetingId) => {
    const targetId = meetingId ?? get().meetings[0]?.id
    set({
      recState: 'recording',
      recordingMeetingId: targetId,
      recordingStartedAt: Date.now(),
      transcriptOpen: true,
      transcriptMinimized: false,
    })
    if (recInterval) clearInterval(recInterval)
    recInterval = setInterval(() => {
      if (get().recState === 'recording') {
        const mic = Math.min(1, Math.max(0.1, Math.random() * 0.85))
        const sys = Math.min(1, Math.max(0.05, Math.random() * 0.6))
        set({ vu: { mic, system: sys } })
      }
    }, 120)
  },

  pauseRecording: () => {
    if (get().recState === 'recording') {
      set({ recState: 'paused', vu: { mic: 0, system: 0 } })
    } else if (get().recState === 'paused') {
      set({ recState: 'recording' })
    }
  },

  stopRecording: () => {
    if (recInterval) clearInterval(recInterval)
    recInterval = null
    const meetingId = get().recordingMeetingId
    set({
      recState: 'idle',
      recordingMeetingId: null,
      recordingStartedAt: null,
      vu: { mic: 0, system: 0 },
    })
    if (meetingId) {
      // Simulate automatic enhancement
      setTimeout(() => {
        get().enhanceMeeting(meetingId)
      }, 500)
    }
  },

  discardAudio: () => {
    if (recInterval) clearInterval(recInterval)
    recInterval = null
    set({
      recState: 'idle',
      recordingMeetingId: null,
      recordingStartedAt: null,
      vu: { mic: 0, system: 0 },
    })
  },

  createMeeting: (title = 'Untitled note', folderId = null) => {
    const newNote: Meeting = {
      id: `note_${Date.now()}_${++entitySeq}`,
      folder_id: folderId,
      title: title || 'Untitled note',
      date: new Date().toISOString(),
      duration_ms: null,
      calendar_event_id: null,
      scratchpad_raw: '',
      scratchpad_json: null,
      enhanced_notes_json: null,
      transcript_json: null,
      updated_at: new Date().toISOString(),
    }
    set({ meetings: [newNote, ...get().meetings] })
    get().openNote(newNote.id)
    return newNote
  },

  deleteMeeting: (id) => {
    set({ meetings: get().meetings.filter((m) => m.id !== id) })
    const r = get().route
    if (r.kind === 'note' && r.noteId === id) {
      get().back()
    }
  },

  duplicateMeeting: (id) => {
    const original = get().meetings.find((m) => m.id === id)
    if (!original) throw new Error('Note not found')
    const dup: Meeting = {
      ...original,
      id: `note_${Date.now()}_${++entitySeq}`,
      title: `${original.title} (Copy)`,
      updated_at: new Date().toISOString(),
    }
    set({ meetings: [dup, ...get().meetings] })
    return dup
  },

  saveTitle: (id, title) => {
    set({
      meetings: get().meetings.map((m) =>
        m.id === id ? { ...m, title, updated_at: new Date().toISOString() } : m
      ),
    })
  },

  saveScratchpad: (id, raw, json = null) => {
    set({
      meetings: get().meetings.map((m) =>
        m.id === id ? { ...m, scratchpad_raw: raw, scratchpad_json: json, updated_at: new Date().toISOString() } : m
      ),
    })
  },

  saveEnhancedNotes: (id, enhancedJson) => {
    set({
      meetings: get().meetings.map((m) =>
        m.id === id ? { ...m, enhanced_notes_json: enhancedJson, updated_at: new Date().toISOString() } : m
      ),
    })
  },

  moveMeeting: (id, folderId) => {
    set({
      meetings: get().meetings.map((m) =>
        m.id === id ? { ...m, folder_id: folderId, updated_at: new Date().toISOString() } : m
      ),
    })
  },

  enhanceMeeting: async (id) => {
    const note = get().meetings.find((m) => m.id === id)
    if (!note) return
    const enhanced: EnhancedDoc = {
      sections: [
        {
          section_title: 'Key Takeaways & Summary',
          bullet_points: [
            { text: note.scratchpad_raw.split('\n')[0] || 'Meeting objectives aligned successfully.', citations: ['seg_1'] },
            { text: 'Core engineering milestones approved for execution.', citations: ['seg_2'] },
          ],
        },
        {
          section_title: 'Decisions',
          bullet_points: [
            { text: 'Finalized architectural patterns and UI token palette.', citations: ['seg_3'] },
          ],
        },
        {
          section_title: 'Action Items',
          bullet_points: [
            { text: 'Publish documentation and review pull requests by end of week.', citations: ['seg_4'] },
          ],
        },
      ],
    }
    get().saveEnhancedNotes(id, JSON.stringify(enhanced))
  },

  createFolder: (name, isShared) => {
    const newFolder: Folder = {
      id: `fld_${Date.now()}_${++entitySeq}`,
      parent_id: null,
      name,
      is_shared: isShared,
      icon: 'folder',
      description: null,
    }
    set({ folders: [...get().folders, newFolder] })
    return newFolder
  },

  renameFolder: (id, name) => {
    set({
      folders: get().folders.map((f) => (f.id === id ? { ...f, name } : f)),
    })
  },

  deleteFolder: (id) => {
    set({
      folders: get().folders.filter((f) => f.id !== id),
      meetings: get().meetings.map((m) => (m.folder_id === id ? { ...m, folder_id: null } : m)),
    })
  },

  toggleActionItem: (id) => {
    set({
      actionItems: get().actionItems.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    })
  },

  addActionItem: (meetingId, task, owner = 'You', deadline = null) => {
    const meeting = get().meetings.find((m) => m.id === meetingId)
    const newItem: ActionItem = {
      id: `act_${Date.now()}_${++entitySeq}`,
      meeting_id: meetingId,
      meeting_title: meeting?.title ?? 'Meeting',
      owner,
      task,
      deadline,
      done: false,
    }
    set({ actionItems: [newItem, ...get().actionItems] })
  },

  deleteActionItem: (id) => {
    set({ actionItems: get().actionItems.filter((item) => item.id !== id) })
  },

  addPerson: (name, email = '') => {
    const newPerson: Person = {
      id: `usr_${Date.now()}_${++entitySeq}`,
      name,
      email: email || null,
      domain: email ? email.split('@')[1] || null : null,
      company_id: null,
      note_count: 0,
      last_note_at: null,
    }
    set({ people: [newPerson, ...get().people] })
    return newPerson
  },

  addCompany: (name, domain = '') => {
    const newCompany: Company = {
      id: `cmp_${Date.now()}_${++entitySeq}`,
      name,
      domain: domain || null,
      note_count: 0,
      last_note_at: null,
    }
    set({ companies: [newCompany, ...get().companies] })
    return newCompany
  },

  sendChatMessage: async (sessionId, content) => {
    let sid = sessionId
    if (!sid) {
      const created = get().createChatSession(content.slice(0, 32))
      sid = created.id
      get().navigate({ kind: 'chat', sessionId: sid })
    }
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_${++entitySeq}`,
      session_id: sid,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    const currentMsgs = get().chatMessages[sid] || []
    set({
      chatMessages: {
        ...get().chatMessages,
        [sid]: [...currentMsgs, userMsg],
      },
    })

    // Simulate smart AI reply from meeting knowledge
    await new Promise((r) => setTimeout(r, 300))
    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}_${++entitySeq}`,
      session_id: sid,
      role: 'assistant',
      content: `I reviewed your meeting notes across **Bagrry**. Regarding "${content}":\n\n- In **Q4 Product Roadmap Sync**, the team confirmed full migration to native GPUIX with Win32 FFI dragging for seamless performance.\n- Action items have been scheduled and assigned to respective owners.\n\nLet me know if you would like me to draft an email or create new action items!`,
      created_at: new Date().toISOString(),
    }
    set({
      chatMessages: {
        ...get().chatMessages,
        [sid]: [...get().chatMessages[sid], assistantMsg],
      },
    })
    return sid
  },

  createChatSession: (title) => {
    const session: ChatSession = {
      id: `chat_${Date.now()}_${++entitySeq}`,
      title: title || 'New chat',
      space_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    set({ chatSessions: [session, ...get().chatSessions] })
    return session
  },

  deleteChatSession: (id) => {
    set({
      chatSessions: get().chatSessions.filter((s) => s.id !== id),
    })
    const r = get().route
    if (r.kind === 'chat' && r.sessionId === id) {
      get().navigate({ kind: 'chat', sessionId: null })
    }
  },

  setSetting: (key, value) => {
    set({
      settings: { ...get().settings, [key]: value },
    })
  },
}))
