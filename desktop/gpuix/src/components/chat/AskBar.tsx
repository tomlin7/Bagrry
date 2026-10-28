import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_SANS } from '../../theme'

interface AskBarProps {
  placeholder?: string
  onSubmit?: (val: string) => void
  onRecipePick?: (prompt: string) => void
}

export function AskBar({
  placeholder = 'Continue chat',
  onSubmit,
  onRecipePick,
}: AskBarProps) {
  const [draft, setDraft] = useState('')
  const colors = useBagrryStore((s) => s.colors)
  const recipes = useBagrryStore((s) => s.recipes)
  const sendChatMessage = useBagrryStore((s) => s.sendChatMessage)
  const navigate = useBagrryStore((s) => s.navigate)

  const handleSubmit = () => {
    if (!draft.trim()) return
    const text = draft.trim()
    setDraft('')
    if (onSubmit) {
      onSubmit(text)
    } else {
      sendChatMessage(null, text)
    }
  }

  const handlePick = (template: string) => {
    if (onRecipePick) {
      onRecipePick(template)
    } else {
      sendChatMessage(null, template)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 8,
      }}
    >
      {/* Input container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 42,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
          paddingLeft: 12,
          paddingRight: 6,
        }}
      >
        <Icons.Sparkles size={16} color={colors.accent} />
        <input
          testId="ask-bar-input"
          value={draft}
          placeholder={placeholder}
          style={{
            flexGrow: 1,
            minWidth: 0,
            fontSize: 13,
            color: colors.text,
            backgroundColor: '#00000000',
            borderWidth: 0,
            fontFamily: FONT_SANS,
          }}
          onChange={(e: any) => setDraft(e.value ?? '')}
          onSubmit={handleSubmit}
        />
        <div
          testId="ask-bar-send"
          onClick={handleSubmit}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: draft.trim() ? colors.solid : colors.hover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: draft.trim() ? 'pointer' : 'default',
          }}
        >
          <Icons.Send size={14} color={draft.trim() ? colors.solidFg : colors.textSubtle} />
        </div>
      </div>

      {/* Recipe chips row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 6,
        }}
      >
        {recipes.map((rcp) => (
          <div
            key={rcp.id}
            onClick={() => handlePick(rcp.prompt_template)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              height: 24,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface2,
              paddingLeft: 8,
              paddingRight: 8,
              cursor: 'pointer',
            }}
          >
            <Icons.Sparkles size={11} color={colors.textSubtle} />
            <text
              style={{
                fontSize: 11,
                color: colors.textMuted,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {rcp.name}
            </text>
          </div>
        ))}
        <div
          onClick={() => navigate({ kind: 'chat', sessionId: null })}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 24,
            paddingLeft: 6,
            paddingRight: 6,
            cursor: 'pointer',
          }}
        >
          <text
            style={{
              fontSize: 11,
              color: colors.textSubtle,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'See all'}
          </text>
        </div>
      </div>
    </div>
  )
}
