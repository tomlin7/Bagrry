import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_SANS } from '../../theme'
import type { Meeting } from '../../types'

interface NoteListProps {
  notes: Meeting[]
  emptyMessage?: string
}

function formatDayLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays <= 7) return 'Previous 7 days'
    return 'Earlier'
  } catch {
    return 'Earlier'
  }
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function NoteList({ notes, emptyMessage = 'No notes yet' }: NoteListProps) {
  const openNote = useBagrryStore((s) => s.openNote)
  const deleteMeeting = useBagrryStore((s) => s.deleteMeeting)
  const duplicateMeeting = useBagrryStore((s) => s.duplicateMeeting)
  const recordingMeetingId = useBagrryStore((s) => s.recordingMeetingId)
  const recState = useBagrryStore((s) => s.recState)
  const colors = useBagrryStore((s) => s.colors)
  const [hoverRow, setHoverRow] = useState<string | null>(null)

  if (notes.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 8,
        }}
      >
        <Icons.NotebookPen size={28} color={colors.textSubtle} />
        <text style={{ fontSize: 13, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
          {emptyMessage}
        </text>
      </div>
    )
  }

  // Group by day label
  const groups: { label: string; items: Meeting[] }[] = []
  for (const note of notes) {
    const label = formatDayLabel(note.date)
    let g = groups.find((item) => item.label === label)
    if (!g) {
      g = { label, items: [] }
      groups.push(g)
    }
    g.items.push(note)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 16 }}>
      {groups.map((group) => (
        <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ paddingLeft: 8, paddingBottom: 4 }}>
            <text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: colors.textSubtle,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {group.label}
            </text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {group.items.map((note) => {
              const isRecording = recState !== 'idle' && recordingMeetingId === note.id
              const isHover = hoverRow === note.id
              const preview = note.scratchpad_raw.slice(0, 90).replace(/\n/g, ' ')

              return (
                <div
                  key={note.id}
                  testId={`note-row-${note.id}`}
                  onClick={() => openNote(note.id)}
                  onMouseEnter={() => setHoverRow(note.id)}
                  onMouseLeave={() => setHoverRow(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    height: 52,
                    borderRadius: 10,
                    paddingLeft: 10,
                    paddingRight: 10,
                    cursor: 'pointer',
                    backgroundColor: isHover ? colors.hover : 'transparent',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: isRecording ? colors.dangerSubtle : colors.surface,
                      borderWidth: 1,
                      borderColor: isRecording ? colors.danger : colors.border,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isRecording ? (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 9999,
                          backgroundColor: colors.danger,
                        }}
                      />
                    ) : (
                      <Icons.NotebookPen size={14} color={colors.textMuted} />
                    )}
                  </div>

                  {/* Title and Preview */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      minWidth: 0,
                      gap: 2,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <text
                        style={{
                          fontSize: 13.5,
                          fontWeight: '500',
                          color: colors.text,
                          fontFamily: FONT_SANS,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {note.title}
                      </text>
                      {note.enhanced_notes_json && (
                        <div
                          style={{
                            paddingLeft: 4,
                            paddingRight: 4,
                            paddingTop: 1,
                            paddingBottom: 1,
                            borderRadius: 4,
                            backgroundColor: colors.accentSubtle,
                          }}
                        >
                          <text
                            style={{
                              fontSize: 9.5,
                              fontWeight: '600',
                              color: colors.accent,
                              fontFamily: FONT_SANS,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {'AI Enhanced'}
                          </text>
                        </div>
                      )}
                    </div>
                    <text
                      style={{
                        fontSize: 11.5,
                        color: colors.textSubtle,
                        fontFamily: FONT_SANS,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {preview || 'No additional content'}
                    </text>
                  </div>

                  {/* Date/Time */}
                  <text
                    style={{
                      fontSize: 11.5,
                      color: colors.textSubtle,
                      fontFamily: FONT_SANS,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatTime(note.date)}
                  </text>

                  {/* Hover action buttons */}
                  {isHover && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        testId={`duplicate-note-${note.id}`}
                        onClick={(e: any) => {
                          e.stopPropagation?.()
                          duplicateMeeting(note.id)
                        }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: colors.hover,
                        }}
                      >
                        <Icons.Copy size={13} color={colors.textMuted} />
                      </div>
                      <div
                        testId={`delete-note-${note.id}`}
                        onClick={(e: any) => {
                          e.stopPropagation?.()
                          deleteMeeting(note.id)
                        }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: colors.hover,
                        }}
                      >
                        <Icons.Trash2 size={13} color={colors.danger} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
