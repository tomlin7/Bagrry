import type { Meeting, Folder, ActionItem, Person, Company, ApiKeyItem } from '../types'

const DEFAULT_SERVER_URL = 'http://127.0.0.1:47821'
const DEFAULT_DEV_TOKEN = 'bgy_live_dev_test_token_47821'

export interface ServerConfig {
  baseUrl: string
  token: string
}

class BagrryApiClient {
  private config: ServerConfig = {
    baseUrl: DEFAULT_SERVER_URL,
    token: DEFAULT_DEV_TOKEN,
  }

  configure(config: Partial<ServerConfig>) {
    this.config = { ...this.config, ...config }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${path}`
    const headers = new Headers(options.headers || {})
    if (this.config.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.config.token}`)
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(url, { ...options, headers })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`Server ${res.status}: ${errBody || res.statusText}`)
    }

    if (res.status === 204) {
      return null as any
    }

    return res.json() as Promise<T>
  }

  // Health
  async checkHealth(): Promise<{ status: string; app: string; version: string }> {
    return this.request('/health')
  }

  // Notes
  async listMeetings(folderId?: string | null): Promise<Meeting[]> {
    const query = folderId ? `?folder_id=${encodeURIComponent(folderId)}` : ''
    const data = await this.request<{ notes: any[] }>(`/v1/notes${query}`)
    return (data.notes || []).map(formatServerNote)
  }

  async getMeeting(id: string): Promise<Meeting> {
    const data = await this.request<{ note: any }>(`/v1/notes/${id}`)
    return formatServerNote(data.note)
  }

  async createMeeting(title: string, folderId?: string | null): Promise<Meeting> {
    const data = await this.request<{ note: any }>('/v1/notes', {
      method: 'POST',
      body: JSON.stringify({ title, folder_id: folderId }),
    })
    return formatServerNote(data.note)
  }

  async saveScratchpad(id: string, scratchpadRaw: string): Promise<void> {
    await this.request(`/v1/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ scratchpad_raw: scratchpadRaw }),
    })
  }

  async saveEnhancedNotes(id: string, enhancedNotesJson: string): Promise<void> {
    let parsed = null
    try {
      parsed = JSON.parse(enhancedNotesJson)
    } catch {
      // send raw or null
    }
    await this.request(`/v1/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enhanced_notes: parsed }),
    })
  }

  async saveTitle(id: string, title: string): Promise<void> {
    await this.request(`/v1/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    })
  }

  async moveMeeting(id: string, folderId?: string | null): Promise<void> {
    await this.request(`/v1/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ folder_id: folderId }),
    })
  }

  async deleteMeeting(id: string): Promise<void> {
    await this.request(`/v1/notes/${id}`, { method: 'DELETE' })
  }

  async enhanceMeeting(id: string, customInstructions?: string): Promise<any> {
    return this.request(`/v1/notes/${id}/enhance`, {
      method: 'POST',
      body: JSON.stringify({ custom_instructions: customInstructions }),
    })
  }

  async runRecipe(id: string, recipeId: string): Promise<{ title: string; content: string }> {
    return this.request(`/v1/notes/${id}/recipes/${recipeId}`, {
      method: 'POST',
    })
  }

  // Audio Ingestion
  async uploadMeetingAudio(
    id: string,
    file: Blob,
    attendeesFile?: Blob,
    autoEnhance = true
  ): Promise<any> {
    const formData = new FormData()
    formData.append('file', file, 'mic.wav')
    if (attendeesFile) {
      formData.append('attendees_file', attendeesFile, 'attendees.wav')
    }
    formData.append('auto_enhance', String(autoEnhance))

    return this.request(`/v1/notes/${id}/audio`, {
      method: 'POST',
      body: formData,
    })
  }

  // Public Share
  async createShareLink(noteId: string): Promise<{ token: string; url: string }> {
    return this.request('/v1/shares', {
      method: 'POST',
      body: JSON.stringify({ note_id: noteId }),
    })
  }

  // Folders
  async listFolders(): Promise<Folder[]> {
    const data = await this.request<{ folders: any[] }>('/v1/folders')
    return (data.folders || []).map((f) => ({
      id: f.id,
      parent_id: f.parent_id,
      name: f.name,
      is_shared: Boolean(f.is_shared),
      icon: f.icon || 'folder',
      description: f.description || null,
    }))
  }

  async createFolder(name: string, isShared = false, icon = 'folder'): Promise<Folder> {
    const data = await this.request<{ folder: any }>('/v1/folders', {
      method: 'POST',
      body: JSON.stringify({ name, is_shared: isShared, icon }),
    })
    return {
      id: data.folder.id,
      parent_id: data.folder.parent_id,
      name: data.folder.name,
      is_shared: Boolean(data.folder.is_shared),
      icon: data.folder.icon || 'folder',
      description: null,
    }
  }

  async renameFolder(id: string, name: string): Promise<void> {
    await this.request(`/v1/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
  }

  async deleteFolder(id: string): Promise<void> {
    await this.request(`/v1/folders/${id}`, { method: 'DELETE' })
  }

  // Action Items
  async listActionItems(noteId?: string, completed?: boolean): Promise<ActionItem[]> {
    const params = new URLSearchParams()
    if (noteId) params.set('note_id', noteId)
    if (completed !== undefined) params.set('completed', String(completed))
    const query = params.toString() ? `?${params.toString()}` : ''

    const data = await this.request<{ action_items: any[] }>(`/v1/action-items${query}`)
    return (data.action_items || []).map((a) => ({
      id: a.id,
      meeting_id: a.note_id || '',
      meeting_title: a.note_title || 'Meeting',
      owner: a.owner || 'You',
      task: a.task,
      deadline: a.deadline || null,
      done: Boolean(a.done),
    }))
  }

  async createActionItem(task: string, noteId?: string, owner = 'You', deadline?: string): Promise<ActionItem> {
    const data = await this.request<{ action_item: any }>('/v1/action-items', {
      method: 'POST',
      body: JSON.stringify({ task, note_id: noteId, owner, deadline }),
    })
    const a = data.action_item
    return {
      id: a.id,
      meeting_id: a.note_id || '',
      meeting_title: a.note_title || 'Meeting',
      owner: a.owner || 'You',
      task: a.task,
      deadline: a.deadline || null,
      done: Boolean(a.done),
    }
  }

  async toggleActionItem(id: string, done: boolean): Promise<void> {
    await this.request(`/v1/action-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done: done ? 1 : 0 }),
    })
  }

  async deleteActionItem(id: string): Promise<void> {
    await this.request(`/v1/action-items/${id}`, { method: 'DELETE' })
  }

  // People & Companies
  async listPeople(): Promise<Person[]> {
    const data = await this.request<{ people: any[] }>('/v1/people')
    return (data.people || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email || '',
      domain: p.domain || '',
      company: p.company_name || null,
      avatar: null,
      notes_count: 0,
    }))
  }

  async createPerson(name: string, email = ''): Promise<Person> {
    const data = await this.request<{ person: any }>('/v1/people', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    })
    const p = data.person
    return {
      id: p.id,
      name: p.name,
      email: p.email || '',
      domain: p.domain || '',
      company: null,
      avatar: null,
      notes_count: 0,
    }
  }

  async listCompanies(): Promise<Company[]> {
    const data = await this.request<{ companies: any[] }>('/v1/companies')
    return (data.companies || []).map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain || '',
      people_count: c.people_count || 0,
      notes_count: 0,
    }))
  }

  async createCompany(name: string, domain = ''): Promise<Company> {
    const data = await this.request<{ company: any }>('/v1/companies', {
      method: 'POST',
      body: JSON.stringify({ name, domain }),
    })
    const c = data.company
    return {
      id: c.id,
      name: c.name,
      domain: c.domain || '',
      people_count: 0,
      notes_count: 0,
    }
  }

  // Search
  async search(query: string): Promise<{ notes: any[]; transcript_matches: any[] }> {
    return this.request(`/v1/search?q=${encodeURIComponent(query)}`)
  }

  // API Keys
  async listKeys(): Promise<ApiKeyItem[]> {
    const data = await this.request<{ keys: any[] }>('/v1/keys')
    return (data.keys || []).map((k) => ({
      id: k.id,
      label: k.label,
      kind: k.kind,
      token: `bgy_live_••••••${k.token_tail || ''}`,
      created_at: k.created_at,
    }))
  }

  async createKey(label: string, kind = 'personal'): Promise<ApiKeyItem> {
    const data = await this.request<{ key: any }>('/v1/keys', {
      method: 'POST',
      body: JSON.stringify({ label, kind }),
    })
    return {
      id: data.key.id,
      label: data.key.label,
      kind: data.key.kind,
      token: data.key.token,
      created_at: data.key.created_at,
    }
  }

  async revokeKey(id: string): Promise<void> {
    await this.request(`/v1/keys/${id}`, { method: 'DELETE' })
  }
}

function formatServerNote(r: any): Meeting {
  let enhancedJson = r.enhanced_notes_json
  if (!enhancedJson && r.enhanced_notes) {
    enhancedJson = typeof r.enhanced_notes === 'string' ? r.enhanced_notes : JSON.stringify(r.enhanced_notes)
  }

  return {
    id: r.id,
    folder_id: r.folder_id || null,
    title: r.title,
    date: r.date,
    duration_ms: r.duration_ms || 0,
    calendar_event_id: r.calendar_event_id || null,
    scratchpad_raw: r.scratchpad_raw || '',
    scratchpad_json: null,
    enhanced_notes_json: enhancedJson || null,
    transcript_json: r.transcript_json || null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

export const api = new BagrryApiClient()
