import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_MONO, FONT_SANS } from '../../theme'

interface NoteEditorProps {
  noteId: string
  content: string
  onChange: (val: string) => void
  onEnhance: () => void
  onExtractActions: () => void
  onDraftEmail: () => void
}

export function NoteEditor({
  noteId,
  content,
  onChange,
  onEnhance,
  onExtractActions,
  onDraftEmail,
}: NoteEditorProps) {
  const colors = useBagrryStore((s) => s.colors)
  const [hoverBtn, setHoverBtn] = useState<string | null>(null)

  const insertText = (prefix: string) => {
    const next = content ? `${content}\n${prefix}` : prefix
    onChange(next)
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 8,
      }}
    >
      {/* Formatting & AI Quick Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 4,
          paddingBottom: 4,
          borderRadius: 8,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        {/* Formatting Buttons */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {/* H1 */}
          <div
            onClick={() => insertText('# ')}
            onMouseEnter={() => setHoverBtn('h1')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              height: 24,
              borderRadius: 4,
              backgroundColor: hoverBtn === 'h1' ? colors.hover : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'H1'}
            </text>
          </div>

          {/* H2 */}
          <div
            onClick={() => insertText('## ')}
            onMouseEnter={() => setHoverBtn('h2')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              height: 24,
              borderRadius: 4,
              backgroundColor: hoverBtn === 'h2' ? colors.hover : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'H2'}
            </text>
          </div>

          {/* Bullet List */}
          <div
            onClick={() => insertText('- ')}
            onMouseEnter={() => setHoverBtn('bullet')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              height: 24,
              borderRadius: 4,
              backgroundColor: hoverBtn === 'bullet' ? colors.hover : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'•'}
            </text>
          </div>

          {/* Numbered List */}
          <div
            onClick={() => insertText('1. ')}
            onMouseEnter={() => setHoverBtn('num')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              height: 24,
              borderRadius: 4,
              backgroundColor: hoverBtn === 'num' ? colors.hover : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <text style={{ fontSize: 11, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'1.'}
            </text>
          </div>

          {/* Task / Todo */}
          <div
            onClick={() => insertText('- [ ] ')}
            onMouseEnter={() => setHoverBtn('task')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              height: 24,
              borderRadius: 4,
              backgroundColor: hoverBtn === 'task' ? colors.hover : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icons.CheckSquare size={12} color={colors.textMuted} />
          </div>

          {/* Divider */}
          <div
            onClick={() => insertText('\n---\n')}
            onMouseEnter={() => setHoverBtn('divider')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              height: 24,
              borderRadius: 4,
              backgroundColor: hoverBtn === 'divider' ? colors.hover : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'—'}
            </text>
          </div>
        </div>

        {/* AI Quick Prompts */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <div
            testId="ai-summarise-btn"
            onClick={onEnhance}
            onMouseEnter={() => setHoverBtn('ai_summarise')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              height: 22,
              borderRadius: 6,
              backgroundColor: hoverBtn === 'ai_summarise' ? colors.accent : colors.accentSubtle,
              paddingLeft: 6,
              paddingRight: 8,
              cursor: 'pointer',
            }}
          >
            <Icons.Sparkles size={11} color={hoverBtn === 'ai_summarise' ? colors.accentFg : colors.accent} />
            <text
              style={{
                fontSize: 10.5,
                fontWeight: '600',
                color: hoverBtn === 'ai_summarise' ? colors.accentFg : colors.accent,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {'Summarise'}
            </text>
          </div>

          <div
            testId="extract-actions-btn"
            onClick={onExtractActions}
            onMouseEnter={() => setHoverBtn('ai_actions')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              height: 22,
              borderRadius: 6,
              backgroundColor: hoverBtn === 'ai_actions' ? colors.hover : colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              paddingLeft: 6,
              paddingRight: 8,
              cursor: 'pointer',
            }}
          >
            <Icons.CheckSquare size={11} color={colors.textMuted} />
            <text style={{ fontSize: 10.5, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'Actions'}
            </text>
          </div>

          <div
            testId="draft-email-btn"
            onClick={onDraftEmail}
            onMouseEnter={() => setHoverBtn('ai_email')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              height: 22,
              borderRadius: 6,
              backgroundColor: hoverBtn === 'ai_email' ? colors.hover : colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              paddingLeft: 6,
              paddingRight: 8,
              cursor: 'pointer',
            }}
          >
            <Icons.Send size={11} color={colors.textMuted} />
            <text style={{ fontSize: 10.5, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'Email'}
            </text>
          </div>
        </div>
      </div>

      {/* Multi-line Textarea Editor */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        }}
      >
        <textarea
          testId="note-scratchpad-input"
          value={content}
          placeholder="Write notes, agenda items, or type / for commands…"
          minRows={14}
          style={{
            fontSize: 13.5,
            lineHeight: 1.6,
            color: colors.text,
            backgroundColor: '#00000000',
            borderWidth: 0,
            padding: 14,
            fontFamily: FONT_SANS,
          }}
          onChange={(e: any) => onChange(e.value ?? '')}
        />

        {/* Editor footer info bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 4,
            paddingBottom: 4,
            borderTopWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface2,
          }}
        >
          <text style={{ fontSize: 10.5, color: colors.textSubtle, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
            {`${wordCount} words · ${content.length} chars`}
          </text>
        </div>
      </div>
    </div>
  )
}
