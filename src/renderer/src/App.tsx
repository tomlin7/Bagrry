import { OnboardingPanel } from '@/components/onboarding'
import { PanelGroup } from '@/components/PanelGroup'
import { SettingsPanel } from '@/components/SettingsPanel'
import { useConfig } from '@/contexts/ConfigContext'
import { useInterviewMode } from '@/hooks/useInterviewMode'
import { AIService } from '@/services/aiService'
import { AudioService } from '@/services/audioService'
import { ConversationSummary } from '@/types/conversation'
import { useEffect, useState, useRef } from 'react'
import './App.css'

function App() {
  const { config, updateConfig } = useConfig()
  const interviewMode = useInterviewMode()
  const [aiService, setAiService] = useState<AIService | null>(null)
  const [audioService] = useState(() => new AudioService())
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [conversationSessions, setConversationSessions] = useState<ConversationSummary[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [attachedScreenshots, setAttachedScreenshots] = useState<string[]>([])
  const attachedScreenshotsRef = useRef<string[]>([])

  // Initialize AI service when API key is available
  useEffect(() => {
    if (config.apiKey && config.apiKey.length > 0) {
      if (aiService) {
        // Update existing service with new config
        aiService.updateConfig(config)
      } else {
        // Create new service
        const newAiService = new AIService(config)
        setAiService(newAiService)
      }
    } else {
      setAiService(null)
    }
  }, [config, aiService])

  // Update conversation sessions when aiService changes
  useEffect(() => {
    const updateSessions = () => {
      if (!aiService) {
        setConversationSessions([])
        setCurrentSessionId(undefined)
        return
      }

      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)
    }

    // Update immediately
    updateSessions()

    // Set up interval to check for updates
    const interval = setInterval(updateSessions, 1000)

    return () => clearInterval(interval)
  }, [aiService])

  useEffect(() => {
    const setupElectronListeners = () => {
      // Handle visibility toggle
      window.electronAPI.onToggleVisibility((_, visible: boolean) => {
        setIsVisible(visible)
        if (!visible) {
          // Clean up when hidden
          if (isRecording) {
            handleToggleRecording()
          }
          // Double ensure click-through is enabled when hidden
          window.electronAPI.setClickThrough(true)
        }
      })

      // Handle interview mode toggle (Ctrl+])
      window.electronAPI.onToggleInterviewMode(() => {
        handleToggleRecording()
      })

      // Handle screenshot capture
      window.electronAPI.onScreenshotCaptured((_, imageData: string) => {
        handleScreenshotAnalysis(imageData)
      })

      // Handle screenshot attachment
      window.electronAPI.onScreenshotAttached((_, imageData: string) => {
        handleScreenshotAttachment(imageData)
      })
    }

    setupElectronListeners()

    return () => {
      window.electronAPI.removeAllListeners('toggle-visibility')
      window.electronAPI.removeAllListeners('toggle-interview-mode')
      window.electronAPI.removeAllListeners('screenshot-captured')
      window.electronAPI.removeAllListeners('screenshot-attached')
    }
  }, [isRecording, aiService])

  const handleToggleRecording = async () => {
    // Mic button controls the mode:
    // Recording ON = Interview Mode (live AI)
    // Recording OFF = Regular Mode
    try {
      if (isRecording) {
        // Stop interview mode if active
        if (interviewMode.state.isActive) {
          await interviewMode.stopInterviewMode()
        } else {
          // Stop legacy audio capture if active
          await audioService.stopSystemAudioCapture()
        }
        setIsRecording(false)
      } else {
        // Start interview mode
        if (!config.apiKey) {
          return
        }
        await interviewMode.startInterviewMode()
        setIsRecording(true)
      }
    } catch (error) {
      console.error('Error toggling recording mode:', error)
    }
  }

  const handleScreenshotAttachment = (imageData: string) => {
    if (!imageData) {
      return
    }

    // Limit to 5 screenshots
    if (attachedScreenshotsRef.current.length >= 5) {
      return
    }

    console.log(`[App] handleScreenshotAttachment called, current count: ${attachedScreenshotsRef.current.length}`)
    const newArray = [...attachedScreenshotsRef.current, imageData]
    attachedScreenshotsRef.current = newArray
    setAttachedScreenshots(newArray)
    console.log(`[App] Updated attachedScreenshots to ${newArray.length} screenshots`)
  }

  const handleScreenshotAnalysis = async (imageData: string) => {
    // Check if we have a valid API key in config even if aiService is not ready
    if (!imageData) {
      return
    }

    if (!config.apiKey || config.apiKey.length === 0) {
      return
    }

    // Get the current attached screenshots from ref to avoid stale closure
    const currentAttachedScreenshots = attachedScreenshotsRef.current
    console.log(`[App] handleScreenshotAnalysis called with attachedScreenshots.length: ${currentAttachedScreenshots.length}`)

    // If there are attached screenshots, send all of them together
    if (currentAttachedScreenshots.length > 0) {
      const allScreenshots = [...currentAttachedScreenshots, imageData]
      console.log(`[App] Sending ${allScreenshots.length} screenshots (${currentAttachedScreenshots.length} attached + 1 current)`)
      await handleMultipleScreenshots(allScreenshots)
      attachedScreenshotsRef.current = [] // Clear ref
      setAttachedScreenshots([]) // Clear attached screenshots after sending
      return
    }

    console.log(`[App] No attached screenshots, proceeding with single screenshot analysis`)

    // Single screenshot analysis (existing behavior)
    if (!aiService) {
      const tempAiService = new AIService(config)
      setAiService(tempAiService)

      // Use the temp service for this analysis
      setIsLoading(true)
      setResponse('')
      try {
        await tempAiService.analyzeScreenshotStream(imageData, (partial) => {
          setResponse(partial)
        })
        // Update conversation sessions
        const sessions = tempAiService.getSessionSummaries()
        const currentSession = tempAiService.getCurrentSession()
        setConversationSessions(sessions)
        setCurrentSessionId(currentSession?.id)
      } catch (error) {
        console.error('Error analyzing screenshot:', error)
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)
    setResponse('')
    try {
      await aiService.analyzeScreenshotStream(imageData, (partial) => {
        setResponse(partial)
      })
      // Update conversation sessions
      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)
    } catch (error) {
      console.error('Error analyzing screenshot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMultipleScreenshots = async (screenshots: string[]) => {
    if (!config.apiKey || config.apiKey.length === 0) {
      return
    }

    if (!aiService) {
      const tempAiService = new AIService(config)
      setAiService(tempAiService)

      setIsLoading(true)
      setResponse('')
      try {
        await tempAiService.analyzeMultipleScreenshotsStream(screenshots, (partial) => {
          setResponse(partial)
        })
        // Update conversation sessions
        const sessions = tempAiService.getSessionSummaries()
        const currentSession = tempAiService.getCurrentSession()
        setConversationSessions(sessions)
        setCurrentSessionId(currentSession?.id)
      } catch (error) {
        console.error('Error analyzing multiple screenshots:', error)
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)
    setResponse('')
    try {
      await aiService.analyzeMultipleScreenshotsStream(screenshots, (partial) => {
        setResponse(partial)
      })
      // Update conversation sessions
      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)
    } catch (error) {
      console.error('Error analyzing multiple screenshots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskQuestion = async (question: string) => {
    if (!question.trim() || !aiService) {
      return
    }
    setIsLoading(true)
    setResponse('')
    try {
      await aiService.askQuestionStream(question, (partial) => {
        setResponse(partial)
      })
      // Update conversation sessions
      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)
    } catch (error) {
      console.error('Error asking question:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearResponse = () => {
    setResponse('')
    if (aiService) {
      aiService.clearHistory()

      // Update conversation sessions
      const sessions = aiService.getSessionSummaries()
      const currentSession = aiService.getCurrentSession()
      setConversationSessions(sessions)
      setCurrentSessionId(currentSession?.id)
    }
  }

  const handleNewSession = () => {
    if (!aiService) return

    const newSession = aiService.createNewSession()
    setResponse('')

    // Update conversation sessions
    const sessions = aiService.getSessionSummaries()
    setConversationSessions(sessions)
    setCurrentSessionId(newSession.id)
  }

  const handleSelectSession = (sessionId: string) => {
    if (!aiService) return

    aiService.loadSession(sessionId)
    setResponse('')
    setCurrentSessionId(sessionId)
  }

  const handleDeleteSession = (sessionId: string) => {
    if (!aiService) return

    aiService.deleteSession(sessionId)

    // Update conversation sessions
    const sessions = aiService.getSessionSummaries()
    const currentSession = aiService.getCurrentSession()
    setConversationSessions(sessions)
    setCurrentSessionId(currentSession?.id)

  }

  const handleToggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
    window.electronAPI.setClickThrough(true)
  }

  // Check if onboarding is completed
  useEffect(() => {
    const isOnboardingCompleted = localStorage.getItem('onboarding-completed')
    if (!isOnboardingCompleted) {
      setShowOnboarding(true)
    }
  }, [])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  // Clear interview mode errors
  useEffect(() => {
    if (interviewMode.state.error) {
      interviewMode.clearError()
    }
  }, [interviewMode.state.error, interviewMode.clearError])

  return (
    <div className="dark h-screen w-screen bg-transparent overflow-hidden relative select-none">
      {/* Full-screen transparent overlay */}
      <div className="absolute inset-0 pointer-events-none" />

      {/* Show main panels only if onboarding is completed and window is visible */}
      {!showOnboarding && isVisible && (
        <>
          <PanelGroup
            onAskQuestion={handleAskQuestion}
            response={response}
            isLoading={isLoading}
            onClearResponse={handleClearResponse}
            onNewSession={handleNewSession}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            isVisible={isVisible}
            onOpenSettings={handleToggleSettings}
            isSettingsOpen={isSettingsOpen}
            conversationSessions={conversationSessions}
            currentSessionId={currentSessionId}
            position={config.position}
            onPositionChange={(position) => updateConfig({ position })}
            interviewModeStatus={interviewMode.state.status}
            interviewModeTranscription={interviewMode.state.transcription}
            interviewModeResponse={interviewMode.state.response}
            isInterviewModeEnabled={isRecording && interviewMode.state.isActive}
            attachedScreenshotsCount={attachedScreenshots.length}
          />

          {/* Settings Panel - positioned in top right of app */}
          {isSettingsOpen && (
            <div className="absolute top-4 right-4 z-50 pointer-events-auto">
              <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={handleCloseSettings}
                className="max-w-[400px]"
              />
            </div>
          )}
        </>
      )}

      {/* Onboarding Panel - shown only once at app start */}
      {showOnboarding && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <OnboardingPanel onComplete={handleOnboardingComplete} className="w-[450px]" />
        </div>
      )}
    </div>
  )
}

export default App
