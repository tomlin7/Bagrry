import React, { useState } from 'react'
import { AnimatePresence, motion } from '@gpuix/react'
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
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="command-palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div
            testId="command-palette-backdrop"
            onClick={() => setOpen(false)}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#00000077',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: 100,
            }}
          >
            <motion.div
              key="command-palette-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                width: '100%',
                maxWidth: 520,
              }}
            >
              <div
                testId="command-palette-modal"
                onClick={(e: any) => e.stopPropagation?.()}
                style={{
                  width: '100%',
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
              <Icons.Search size={16} color={colors.textMuted} />
              <input
                testId="command-palette-input"
                autoFocus
                value={query}
                placeholder="Search notes or jump to…"
                onChange={(e: any) => setQuery(e.value ?? '')}
                style={{
                  flexGrow: 1,
                  height: 32,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: '#00000000',
                  borderWidth: 0,
                  padding: 0,
                  fontFamily: FONT_SANS,
                }}
              />
              <div
                style={{
                  paddingLeft: 6,
                  paddingRight: 6,
                  paddingTop: 2,
                  paddingBottom: 2,
                  borderRadius: 4,
                  backgroundColor: colors.surface2,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <text style={{ fontSize: 10.5, fontFamily: FONT_MONO, color: colors.textSubtle, whiteSpace: 'nowrap' }}>
                  {'ESC'}
                </text>
              </div>
            </div>

            {/* Results Section */}
            <div
              style={{
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: 320,
                overflowY: 'scroll',
              }}
            >
              {/* Meeting Notes */}
              <div style={{ paddingLeft: 8, paddingTop: 6, paddingBottom: 4 }}>
                <text style={{ fontSize: 11, fontWeight: '600', color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Meeting Notes'}
                </text>
              </div>

              {filteredNotes.map((note, idx) => {
                const isHovered = hoverIndex === idx
                return (
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
                      justifyContent: 'space-between',
                      height: 36,
                      borderRadius: 8,
                      paddingLeft: 10,
                      paddingRight: 10,
                      cursor: 'pointer',
                      backgroundColor: isHovered ? colors.hover : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flexGrow: 1 }}>
                      <Icons.NotebookPen size={14} color={isHovered ? colors.text : colors.textMuted} />
                      <text
                        style={{
                          fontSize: 13,
                          fontWeight: '500',
                          color: colors.text,
                          fontFamily: FONT_SANS,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {note.title}
                      </text>
                    </div>
                    <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                      {note.date.slice(0, 10)}
                    </text>
                  </div>
                )
              })}

              {/* Navigation items */}
              <div style={{ paddingLeft: 8, paddingTop: 10, paddingBottom: 4 }}>
                <text style={{ fontSize: 11, fontWeight: '600', color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Navigation'}
                </text>
              </div>

              {quickNav.map((item, idx) => {
                const navIdx = 100 + idx
                const isHovered = hoverIndex === navIdx
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    onClick={() => {
                      setOpen(false)
                      item.action()
                    }}
                    onMouseEnter={() => setHoverIndex(navIdx)}
                    onMouseLeave={() => setHoverIndex(null)}
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
                      backgroundColor: isHovered ? colors.hover : 'transparent',
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
