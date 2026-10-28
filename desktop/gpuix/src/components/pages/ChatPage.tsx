import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'
import { AskBar } from '../chat/AskBar'

interface ChatPageProps {
  sessionId: string | null
}

export function ChatPage({ sessionId }: ChatPageProps) {
  const profile = useBagrryStore((s) => s.profile)
  const chatSessions = useBagrryStore((s) => s.chatSessions)
  const chatMessages = useBagrryStore((s) => s.chatMessages)
  const sendChatMessage = useBagrryStore((s) => s.sendChatMessage)
  const deleteChatSession = useBagrryStore((s) => s.deleteChatSession)
  const navigate = useBagrryStore((s) => s.navigate)
  const colors = useBagrryStore((s) => s.colors)

  const [hoverSession, setHoverSession] = useState<string | null>(null)
  const firstName = profile.name.split(' ')[0] || 'there'

  const messages = sessionId ? chatMessages[sessionId] || [] : []
  const session = chatSessions.find((s) => s.id === sessionId)

  // Landing view when no session selected
  if (!sessionId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
          overflow: 'hidden',
          alignItems: 'center',
          paddingTop: 48,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 640,
            paddingLeft: 24,
            paddingRight: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <text
            style={{
              fontSize: 26,
              fontFamily: FONT_DISPLAY,
              fontWeight: '600',
              color: colors.text,
              whiteSpace: 'nowrap',
            }}
          >
            {`Hi ${firstName}, ask anything`}
          </text>

          <AskBar placeholder="What decisions were made?" />

          {chatSessions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.textSubtle,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {'Recents'}
              </text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {chatSessions.map((item) => {
                  const isHover = hoverSession === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate({ kind: 'chat', sessionId: item.id })}
                      onMouseEnter={() => setHoverSession(item.id)}
                      onMouseLeave={() => setHoverSession(null)}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        height: 38,
                        borderRadius: 8,
                        paddingLeft: 10,
                        paddingRight: 10,
                        cursor: 'pointer',
                        backgroundColor: isHover ? colors.hover : 'transparent',
                      }}
                    >
                      <Icons.MessageSquare size={14} color={colors.textMuted} />
                      <text
                        style={{
                          fontSize: 13,
                          color: colors.text,
                          fontFamily: FONT_SANS,
                          flexGrow: 1,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </text>
                      {isHover && (
                        <div
                          onClick={(e: any) => {
                            e.stopPropagation?.()
                            deleteChatSession(item.id)
                          }}
                          style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icons.Trash2 size={12} color={colors.danger} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Active chat thread view
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Session Title Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: 40,
          paddingLeft: 24,
          paddingRight: 24,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <text style={{ fontSize: 13, fontWeight: '600', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
          {session?.title || 'Chat'}
        </text>
      </div>

      {/* Message history */}
      <div
        style={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          paddingBottom: 110,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 680,
            paddingLeft: 24,
            paddingRight: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  borderRadius: 12,
                  paddingLeft: 14,
                  paddingRight: 14,
                  paddingTop: 10,
                  paddingBottom: 10,
                  backgroundColor: msg.role === 'user' ? colors.hover : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <text
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: colors.text,
                    fontFamily: FONT_SANS,
                  }}
                >
                  {msg.content}
                </text>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Docked AskBar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: 16,
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        <div style={{ width: '100%', maxWidth: 680, paddingLeft: 24, paddingRight: 24 }}>
          <AskBar
            placeholder="Ask a follow up…"
            onSubmit={(content) => sendChatMessage(sessionId, content)}
          />
        </div>
      </div>
    </div>
  )
}
