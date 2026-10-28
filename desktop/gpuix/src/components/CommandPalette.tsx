import React, { useState } from 'react'
import { useBagrryStore } from '../store/bagrry-store'
import { Icons } from './icons'
import { FONT_MONO, FONT_SANS } from '../theme'

export function CommandPalette() {
  const open = useBagrryStore((s) => s.paletteOpen)
  const setOpen = useBagrryStore((s) => s.setPaletteOpen)
  const meetings = useBagrryStore((s) => s.meetings)
  const navigate = useBagrryStore((s) => s.navigate)
  const openNote = useBagrryStore((s) => s.openNote)
  const colors = useBagrryStore((s) => s.colors)

  const [query, setQuery] = useState('')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (!open) return null

  const filteredNotes = query.trim()
    ? meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(query.toLowerCase()) ||
          m.scratchpad_raw.toLowerCase().includes(query.toLowerCase())
      )
    : meetings.slice(0, 5)

  const quickNav = [
    { label: 'Go to Home', action: () => navigate({ kind: 'home' }), icon: Icons.Home },
    { label: 'Go to Shared with me', action: () => navigate({ kind: 'shared' }), icon: Icons.Users },
    { label: 'New Chat session', action: () => navigate({ kind: 'chat', sessionId: null }), icon: Icons.MessageSquare },
    { label: 'Open Settings', action: () => navigate({ kind: 'settings', tab: 'preferences' }), icon: Icons.Settings },
  ]

  return (
    <div
      testId="command-palette-backdrop"
      onClick={() => setOpen(false)}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#00000077',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 100,
      }}
    >
      <div
        testId="command-palette-modal"
        onClick={(e: any) => e.stopPropagation?.()}
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 16,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingLeft: 14,
            paddingRight: 14,
            height: 48,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Icons.Search size={16} color={colors.textSubtle} />
          <input
            testId="command-palette-input"
            value={query}
            placeholder="Search notes or jump to…"
            style={{
              flexGrow: 1,
              minWidth: 0,
              fontSize: 13.5,
              color: colors.text,
              backgroundColor: '#00000000',
              borderWidth: 0,
              fontFamily: FONT_SANS,
            }}
            onChange={(e: any) => setQuery(e.value ?? '')}
          />
          <div
            onClick={() => setOpen(false)}
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 4,
              backgroundColor: colors.hover,
              cursor: 'pointer',
            }}
          >
            <text style={{ fontSize: 10.5, fontFamily: FONT_MONO, color: colors.textSubtle, whiteSpace: 'nowrap' }}>
              {'ESC'}
            </text>
          </div>
        </div>

        {/* Results List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 320,
            overflow: 'hidden',
            padding: 8,
            gap: 2,
          }}
        >
          <div style={{ paddingLeft: 8, paddingTop: 4, paddingBottom: 2 }}>
            <text style={{ fontSize: 11, fontWeight: '600', color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {query.trim() ? 'Matching Notes' : 'Recent Notes'}
            </text>
          </div>

          {filteredNotes.map((note, idx) => (
            <div
              key={note.id}
              onClick={() => {
                setOpen(false)
                openNote(note.id)
              }}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                height: 36,
                borderRadius: 8,
                paddingLeft: 10,
                paddingRight: 10,
                cursor: 'pointer',
                backgroundColor: hoverIndex === idx ? colors.hover : 'transparent',
              }}
            >
              <Icons.NotebookPen size={14} color={colors.textMuted} />
              <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, flexGrow: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {note.title}
              </text>
              <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {note.date.slice(0, 10)}
              </text>
            </div>
          ))}

          <div style={{ paddingLeft: 8, paddingTop: 8, paddingBottom: 2 }}>
            <text style={{ fontSize: 11, fontWeight: '600', color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'Navigation'}
            </text>
          </div>

          {quickNav.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                onClick={() => {
                  setOpen(false)
                  item.action()
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  height: 34,
                  borderRadius: 8,
                  paddingLeft: 10,
                  paddingRight: 10,
                  cursor: 'pointer',
                }}
              >
                <Icon size={14} color={colors.textMuted} />
                <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {item.label}
                </text>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
