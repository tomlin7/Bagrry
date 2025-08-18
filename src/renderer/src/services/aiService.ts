import { AppConfig } from '@/contexts/ConfigContext'
import { ConversationSession, ConversationSummary, ConversationMessage } from '@/types/conversation'
import { GoogleGenAI } from '@google/genai'

export class AIService {
  private genAI: GoogleGenAI
  private currentSession: ConversationSession | null = null
  private config: AppConfig
  private readonly SESSIONS_STORAGE_KEY = 'clue-conversation-sessions'

  constructor(config: AppConfig) {
    this.config = config
    this.genAI = new GoogleGenAI({ apiKey: config.apiKey })

    // Always create a new session when app opens
    this.createNewSession()
  }

  private createSystemMessage(): { text: string } {
    const selectedMode = this.config.modes.find((m) => m.id === this.config.selectedModeId)

    if (!selectedMode?.prompt) {
      // Fallback to first available mode
      const firstMode = this.config.modes[0]
      if (!firstMode?.prompt) {
        throw new Error('No modes available with prompts')
      }
      return { text: firstMode.prompt }
    }

    return { text: selectedMode.prompt }
  }

  private generateSessionTitle(firstMessage: string): string {
    // Extract a meaningful title from the first message
    const words = firstMessage.trim().split(' ').slice(0, 5)
    return words.join(' ') + (firstMessage.length > words.join(' ').length ? '...' : '')
  }

  createNewSession(): ConversationSession {
    // Save current session if it exists
    if (this.currentSession) {
      this.saveSession(this.currentSession)
    }

    // Create new session
    const newSession: ConversationSession = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: 'New Conversation',
      messages: [{ role: 'user', parts: [this.createSystemMessage()] }],
      createdAt: new Date(),
      lastModified: new Date()
    }

    this.currentSession = newSession
    return newSession
  }

  loadSession(sessionId: string): ConversationSession | null {
    const sessions = this.getAllSessions()
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      this.currentSession = session
      return session
    }
    return null
  }

  /**
   * Analyze a resume's extracted text and return a summary string of capabilities, industry, skills, achievements, education, etc.
   * The summary is concise and suitable for use as user context.
   */
  async analyzeResumePdf(resumeText: string): Promise<string> {
    try {
      const prompt = `You are an expert resume analyst. When given a resume, prepare a concise, structured summary as if it's your resume and you are speaking about yourself:
- Short summary
- Capabilities
- Industry
- Key skills
- Achievements (if any)
- Work experience (companies, roles, responsibilities)
- Certifications (if any)
- Languages (if any)
- Projects (if any)
- Publications (if any)
- Education (universities, degrees)

<general_guidelines>
- ALWAYS respond in the first person, it is your resume.
- ALWAYS USE MARKDOWN FORMATTING.
- NEVER use meta-phrases (e.g., "let me help you", "here is a summary of the resume text you provided").
- ALWAYS be specific, detailed, and accurate.
- ALWAYS acknowledge uncertainty when present.

<output_format>
- Respond in 1-2 paragraphs, using clear, readable text.
- Do not include the raw resume text in your response.

Resume text:
${resumeText}`

      const result = await this.genAI.models.generateContent({
        model: this.config.aiModel || 'gemini-2.5-pro',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })

      return result.candidates[0].content.parts[0].text
    } catch (error) {
      console.error('Error analyzing resume text:', error)
      throw new Error('Failed to analyze resume text')
    }
  }

  async analyzeScreenshot(imageData: string): Promise<string> {
    try {
      // Ensure we have a current session
      if (!this.currentSession) {
        this.createNewSession()
      }

      // Double check currentSession is not null
      if (!this.currentSession) {
        throw new Error('Failed to create session')
      }

      const prompt = 'Analyze the screen first.'
      const base64Data = imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
      
      const result = await this.genAI.models.generateContent({
        model: this.config.aiModel || 'gemini-2.5-pro',
        contents: [{ 
          parts: [
            { text: prompt },
            { 
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
              }
            }
          ] 
        }],
        config: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })

      const responseText = result.candidates[0].content.parts[0].text

      const userMessage = { role: 'user' as const, parts: [{ text: 'Screenshot' }] }
      const aiMessage = { role: 'model' as const, parts: [{ text: responseText }] }

      // Update session title if this is the first non-system message
      if (this.currentSession.messages.length === 1) {
        this.currentSession.title = this.generateSessionTitle(userMessage.parts[0].text)
      }

      // Add to conversation history
      this.currentSession.messages.push(userMessage, aiMessage)
      this.currentSession.lastModified = new Date()

      // Keep only last 20 messages to manage memory (excluding system message)
      if (this.currentSession.messages.length > 21) {
        const systemMsg = this.currentSession.messages[0]
        this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
      }

      // Save session
      this.saveSession(this.currentSession!)

      return responseText
    } catch (error) {
      console.error('Error analyzing screenshot:', error)
      throw new Error('Failed to analyze screenshot')
    }
  }

  async askQuestion(question: string): Promise<string> {
    try {
      // Ensure we have a current session
      if (!this.currentSession) {
        this.createNewSession()
      }

      // Double check currentSession is not null
      if (!this.currentSession) {
        throw new Error('Failed to create session')
      }

      const result = await this.genAI.models.generateContent({
        model: this.config.aiModel || 'gemini-2.5-pro',
        contents: [{ parts: [{ text: question }] }],
        config: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })

      const responseText = result.candidates[0].content.parts[0].text

      const userMessage = { role: 'user' as const, parts: [{ text: question }] }
      const aiMessage = { role: 'model' as const, parts: [{ text: responseText }] }

      // Update session title if this is the first non-system message
      if (this.currentSession.messages.length === 1) {
        this.currentSession.title = this.generateSessionTitle(question)
      }

      // Add to conversation history
      this.currentSession.messages.push(userMessage, aiMessage)
      this.currentSession.lastModified = new Date()

      // Keep only last 20 messages to manage memory (excluding system message)
      if (this.currentSession.messages.length > 21) {
        const systemMsg = this.currentSession.messages[0]
        this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
      }

      // Save session
      this.saveSession(this.currentSession!)

      return responseText
    } catch (error) {
      console.error('Error asking question:', error)
      throw new Error('Failed to get AI response')
    }
  }

  /**
   * Stream AI response for a question, calling onToken with each new chunk.
   */
  async askQuestionStream(question: string, onToken: (partial: string) => void): Promise<void> {
    if (!this.currentSession) {
      this.createNewSession()
    }
    if (!this.currentSession) {
      throw new Error('Failed to create session')
    }

    // Build conversation history for the model
    const history = this.currentSession.messages.slice(1) // Skip system message
    const historyContents = history.map(msg => ({
      role: msg.role,
      parts: msg.parts
    }))

    let fullResponse = ''
    let hadFirstToken = false

    try {
      console.log('[AIService] Starting question stream with model:', this.config.aiModel)
      const result = await this.genAI.models.generateContentStream({
        model: this.config.aiModel || 'gemini-2.5-pro',
        contents: [
          ...historyContents,
          { role: 'user', parts: [{ text: question }] }
        ],
        config: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })
      
      for await (const chunk of result) {
        const chunkText = chunk.text
        if (chunkText) {
          fullResponse += chunkText
          onToken(fullResponse)
          hadFirstToken = true
        }
      }
    } catch (err) {
      console.error('[AIService] Streaming error (askQuestionStream):', err)
      console.error('[AIService] Model being used:', this.config.aiModel)
      if (!hadFirstToken) throw err
    }

    // Add to conversation history
    const userMessage = { role: 'user' as const, parts: [{ text: question }] }
    const aiMessage = { role: 'model' as const, parts: [{ text: fullResponse }] }
    if (this.currentSession.messages.length === 1) {
      this.currentSession.title = this.generateSessionTitle(question)
    }
    this.currentSession.messages.push(userMessage, aiMessage)
    this.currentSession.lastModified = new Date()
    if (this.currentSession.messages.length > 21) {
      const systemMsg = this.currentSession.messages[0]
      this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
    }
    this.saveSession(this.currentSession!)
  }

  /**
   * Stream AI response for screenshot analysis, calling onToken with each new chunk.
   */
  async analyzeScreenshotStream(
    imageData: string,
    onToken: (partial: string) => void
  ): Promise<void> {
    if (!this.currentSession) {
      this.createNewSession()
    }
    if (!this.currentSession) {
      throw new Error('Failed to create session')
    }

    const prompt = 'Analyze the screen first.'
    const base64Data = imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix

    let fullResponse = ''
    let hadFirstToken = false

    try {
      console.log('[AIService] Starting single screenshot analysis with model:', this.config.aiModel)
      const result = await this.genAI.models.generateContentStream({
        model: this.config.aiModel || 'gemini-2.5-pro',
        contents: [{ 
          parts: [
            { text: prompt },
            { 
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
              }
            }
          ] 
        }],
        config: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })
      
      for await (const chunk of result) {
        const chunkText = chunk.text
        if (chunkText) {
          fullResponse += chunkText
          onToken(fullResponse)
          hadFirstToken = true
        }
      }
    } catch (err) {
      console.error('[AIService] Streaming error (analyzeScreenshotStream):', err)
      console.error('[AIService] Model being used:', this.config.aiModel)
      if (!hadFirstToken) throw err
    }

    const userMessage = { role: 'user' as const, parts: [{ text: 'Screenshot' }] }
    const aiMessage = { role: 'model' as const, parts: [{ text: fullResponse }] }
    if (this.currentSession.messages.length === 1) {
      this.currentSession.title = this.generateSessionTitle(userMessage.parts[0].text)
    }
    this.currentSession.messages.push(userMessage, aiMessage)
    this.currentSession.lastModified = new Date()
    if (this.currentSession.messages.length > 21) {
      const systemMsg = this.currentSession.messages[0]
      this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
    }
    this.saveSession(this.currentSession!)
  }

  /**
   * Stream AI response for multiple screenshots analysis, calling onToken with each new chunk.
   */
  async analyzeMultipleScreenshotsStream(
    screenshots: string[],
    onToken: (partial: string) => void
  ): Promise<void> {
    if (!this.currentSession) {
      this.createNewSession()
    }
    if (!this.currentSession) {
      throw new Error('Failed to create session')
    }

    // Create parts array with text prompt and all screenshots
    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [
      { text: `Analyze these ${screenshots.length} screenshots. Please provide a comprehensive analysis of what you see across all images, noting any patterns, relationships, or important details.` }
    ]

    // Add all screenshots as inlineData parts
    for (const screenshot of screenshots) {
      const base64Data = screenshot.split(',')[1] // Remove data:image/jpeg;base64, prefix
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      })
    }

    console.log(`[AIService] Processing ${screenshots.length} screenshots with ${parts.length} total parts`)

    let fullResponse = ''
    let hadFirstToken = false

    try {
      console.log('[AIService] Starting multiple screenshots analysis with model:', this.config.aiModel)
      const result = await this.genAI.models.generateContentStream({
        model: this.config.aiModel || 'gemini-2.5-pro',
        contents: [{ parts }],
        config: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      })
      
      for await (const chunk of result) {
        const chunkText = chunk.text
        if (chunkText) {
          fullResponse += chunkText
          onToken(fullResponse)
          hadFirstToken = true
        }
      }
    } catch (err) {
      console.error('[AIService] Streaming error (analyzeMultipleScreenshotsStream):', err)
      console.error('[AIService] Model being used:', this.config.aiModel)
      if (!hadFirstToken) throw err
    }

    const userMessage = { role: 'user' as const, parts: [{ text: `Multiple Screenshots (${screenshots.length})` }] }
    const aiMessage = { role: 'model' as const, parts: [{ text: fullResponse }] }
    if (this.currentSession.messages.length === 1) {
      this.currentSession.title = this.generateSessionTitle(userMessage.parts[0].text)
    }
    this.currentSession.messages.push(userMessage, aiMessage)
    this.currentSession.lastModified = new Date()
    if (this.currentSession.messages.length > 21) {
      const systemMsg = this.currentSession.messages[0]
      this.currentSession.messages = [systemMsg, ...this.currentSession.messages.slice(-20)]
    }
    this.saveSession(this.currentSession!)
  }

  clearHistory(): void {
    if (this.currentSession) {
      this.currentSession.messages = [{ role: 'user', parts: [this.createSystemMessage()] }]
      this.currentSession.title = 'New Conversation'
      this.currentSession.lastModified = new Date()
      this.saveSession(this.currentSession!)
    }
  }

  getCurrentSession(): ConversationSession | null {
    return this.currentSession
  }

  getConversationHistory(): any[] {
    return this.currentSession ? [...this.currentSession.messages] : []
  }

  getAllSessions(): ConversationSession[] {
    try {
      const stored = localStorage.getItem(this.SESSIONS_STORAGE_KEY)
      if (stored) {
        const sessionsData = JSON.parse(stored)
        return sessionsData.map((sessionData: any) => ({
          ...sessionData,
          createdAt: new Date(sessionData.createdAt),
          lastModified: new Date(sessionData.lastModified),
          messages: sessionData.messages.map((msg: any) => ({
            role: msg.role,
            parts: msg.parts
          }))
        }))
      }
      return []
    } catch (error) {
      console.warn('Failed to load sessions:', error)
      return []
    }
  }

  getSessionSummaries(): ConversationSummary[] {
    const sessions = this.getAllSessions()
    return sessions
      .map((session) => {
        const userMessages = session.messages.filter((msg) => msg.role === 'user')
        const lastUserMessage = userMessages[userMessages.length - 1]

        return {
          id: session.id,
          title: session.title,
          preview: lastUserMessage
            ? typeof lastUserMessage.parts[0].text === 'string'
              ? lastUserMessage.parts[0].text.slice(0, 100) +
                (lastUserMessage.parts[0].text.length > 100 ? '...' : '')
              : 'Complex message'
            : 'No messages',
          createdAt: session.createdAt,
          lastModified: session.lastModified,
          messageCount: Math.max(0, session.messages.length - 1) // Exclude system message
        }
      })
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getAllSessions().filter((s) => s.id !== sessionId)
    this.saveSessions(sessions)

    // If we deleted the current session, create a new one
    if (this.currentSession?.id === sessionId) {
      this.createNewSession()
    }
  }

  private saveSession(session: ConversationSession): void {
    const sessions = this.getAllSessions()
    const existingIndex = sessions.findIndex((s) => s.id === session.id)

    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.push(session)
    }

    this.saveSessions(sessions)
  }

  private saveSessions(sessions: ConversationSession[]): void {
    try {
      const sessionsData = sessions.map((session) => ({
        ...session,
        messages: session.messages.map((msg) => ({
          role: msg.role,
          parts: msg.parts
        }))
      }))
      localStorage.setItem(this.SESSIONS_STORAGE_KEY, JSON.stringify(sessionsData))
    } catch (error) {
      console.warn('Failed to save sessions:', error)
    }
  }

  updateConfig(newConfig: AppConfig): void {
    this.config = newConfig

    // Update the genAI instance if apiKey changed
    this.genAI = new GoogleGenAI({ apiKey: newConfig.apiKey })

    // Update current session's system message if mode changed
    if (this.currentSession && this.currentSession.messages.length > 0) {
      const newSystemMessage = this.createSystemMessage()
      this.currentSession.messages[0] = { role: 'user', parts: [newSystemMessage] }
      this.saveSession(this.currentSession!)
    }
  }
}
