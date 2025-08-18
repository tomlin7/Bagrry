export interface InterviewProfile {
  id: string
  name: string
  icon: string
  prompt: string
}
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface AIMode {
  id: string
  name: string
  icon: string
  prompt: string
  category?: string
  isCustom?: boolean
}

export interface InterviewModeConfig {
  screenshotInterval: number
  screenshotQuality: 'low' | 'medium' | 'high'
  language: string
}

export interface AppConfig {
  opacity: number
  aiModel: string
  theme: 'light' | 'dark' | 'system'
  position: { x: number; y: number }
  selectedModeId: string
  modes: AIMode[]
  apiKey: string
  interviewMode: InterviewModeConfig
  tools: string[]
  interviewProfiles: InterviewProfile[]
  selectedInterviewProfileId: string
  interviewPrompt?: string // currently selected profile's prompt (optional, for convenience)
}

export interface ElectronAPI {
  // Window management
  setClickThrough: (enabled: boolean) => Promise<void>
  getScreenSize: () => Promise<{ width: number; height: number }>

  // Audio management
  audio: {
    sendData: (audioData: string) => Promise<{ success: boolean; error?: string }>
  }

  // Screen capture
  captureScreen: (quality: 'low' | 'medium' | 'high') => Promise<string>

  // Live AI Session
  saveConversationTurn: (data: {
    sessionId: string
    turn: { timestamp: number; transcription: string; ai_response: string }
    fullHistory: Array<{ timestamp: number; transcription: string; ai_response: string }>
  }) => Promise<void>

  // Config management
  config: {
    get: () => Promise<AppConfig>
    update: (updates: Partial<AppConfig>) => Promise<void>
    addMode: (mode: Omit<AIMode, 'id'> & { id?: string }) => Promise<string>
    updateMode: (id: string, updates: Partial<Omit<AIMode, 'id'>>) => Promise<void>
    deleteMode: (id: string) => Promise<void>
    selectMode: (id: string) => Promise<void>
    getSelectedMode: () => Promise<AIMode | undefined>
    reset: () => Promise<void>
    export: () => Promise<string>
    import: (configJson: string) => Promise<boolean>
    setApiKey: (apiKey: string) => Promise<void>
    getApiKey: () => Promise<string>
    hasValidApiKey: () => Promise<boolean>
    clearApiKey: () => Promise<void>
    getConfigPath: () => Promise<string>
    openConfigFile: () => Promise<void>
    openConfigFolder: () => Promise<void>
    reload: () => Promise<void>
  }

  // Event listeners
  onToggleVisibility: (callback: (event: IpcRendererEvent, visible: boolean) => void) => void
  onToggleInterviewMode: (callback: (event: IpcRendererEvent) => void) => void
  onMovePanels: (callback: (event: IpcRendererEvent, direction: string) => void) => void
  onScrollChat: (callback: (event: IpcRendererEvent, direction: string) => void) => void
  onScreenshotCaptured: (callback: (event: IpcRendererEvent, imageData: string) => void) => void
  onScreenshotAttached: (callback: (event: IpcRendererEvent, imageData: string) => void) => void
  onAudioDataReceived: (callback: (event: IpcRendererEvent, audioData: string) => void) => void

  // Remove listeners
  removeAllListeners: (channel: string) => void
}

const electronAPI: ElectronAPI = {
  // Window management
  setClickThrough: (enabled: boolean) => ipcRenderer.invoke('set-click-through', enabled),
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),

  // Audio management
  audio: {
    sendData: (audioData: string) => ipcRenderer.invoke('audio:send-data', audioData)
  },

  // Screen capture
  captureScreen: (quality: 'low' | 'medium' | 'high') =>
    ipcRenderer.invoke('capture-screen', quality),

  // Live AI Session
  saveConversationTurn: (data) => ipcRenderer.invoke('save-conversation-turn', data),

  // Config management
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (updates: Partial<AppConfig>) => ipcRenderer.invoke('config:update', updates),
    addMode: (mode: Omit<AIMode, 'id'> & { id?: string }) =>
      ipcRenderer.invoke('config:add-mode', mode),
    updateMode: (id: string, updates: Partial<Omit<AIMode, 'id'>>) =>
      ipcRenderer.invoke('config:update-mode', id, updates),
    deleteMode: (id: string) => ipcRenderer.invoke('config:delete-mode', id),
    selectMode: (id: string) => ipcRenderer.invoke('config:select-mode', id),
    getSelectedMode: () => ipcRenderer.invoke('config:get-selected-mode'),
    reset: () => ipcRenderer.invoke('config:reset'),
    export: () => ipcRenderer.invoke('config:export'),
    import: (configJson: string) => ipcRenderer.invoke('config:import', configJson),
    setApiKey: (apiKey: string) => ipcRenderer.invoke('config:set-api-key', apiKey),
    getApiKey: () => ipcRenderer.invoke('config:get-api-key'),
    hasValidApiKey: () => ipcRenderer.invoke('config:has-valid-api-key'),
    clearApiKey: () => ipcRenderer.invoke('config:clear-api-key'),
    getConfigPath: () => ipcRenderer.invoke('config:get-config-path'),
    openConfigFile: () => ipcRenderer.invoke('config:open-config-file'),
    openConfigFolder: () => ipcRenderer.invoke('config:open-config-folder'),
    reload: () => ipcRenderer.invoke('config:reload')
  },

  // Event listeners
  onToggleVisibility: (callback) => ipcRenderer.on('toggle-visibility', callback),
  onToggleInterviewMode: (callback) => ipcRenderer.on('toggle-interview-mode', callback),
  onMovePanels: (callback) => ipcRenderer.on('move-panels', callback),
  onScrollChat: (callback) => ipcRenderer.on('scroll-chat', callback),
  onScreenshotCaptured: (callback) => ipcRenderer.on('screenshot-captured', callback),
  onScreenshotAttached: (callback) => ipcRenderer.on('screenshot-attached', callback),
  onAudioDataReceived: (callback) => ipcRenderer.on('audio-data-received', callback),

  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
