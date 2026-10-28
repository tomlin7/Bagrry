import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_MONO, FONT_SANS } from '../../theme'
import { RecordingControls } from './RecordingControls'
import { RecordingPill } from './RecordingPill'

interface TranscriptPanelProps {
  noteId: string
}

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TranscriptPanel({ noteId }: TranscriptPanelProps) {
  const recState = useBagrryStore((s) => s.recState)
  const liveSegments = useBagrryStore((s) => s.liveSegments)
  const transcriptOpen = useBagrryStore((s) => s.transcriptOpen)
  const setTranscriptOpen = useBagrryStore((s) => s.setTranscriptOpen)
  const transcriptMinimized = useBagrryStore((s) => s.transcriptMinimized)
  const setTranscriptMinimized = useBagrryStore((s) => s.setTranscriptMinimized)
  const recordingStartedAt = useBagrryStore((s) => s.recordingStartedAt)
  const colors = useBagrryStore((s) => s.colors)

  const [query, setQuery] = useState('')
  const [hoverBtn, setHoverBtn] = useState<string | null>(null)

  if (!transcriptOpen) return null

  const filtered = query.trim()
    ? liveSegments.filter((seg) => seg.text.toLowerCase().includes(query.toLowerCase()))
    : liveSegments

  if (transcriptMinimized) {
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 20,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <RecordingPill />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 24,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: 340,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 14,
            paddingRight: 10,
            height: 40,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, flexGrow: 1 }}>
            <text style={{ fontSize: 13, fontWeight: '600', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'Live Transcript'}
            </text>
            {recState !== 'idle' && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  backgroundColor: colors.danger,
                }}
              />
            )}
          </div>

          {/* Search input in header */}
          <input
            value={query}
            placeholder="Search transcript…"
            style={{
              width: 140,
              height: 26,
              fontSize: 11.5,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface2,
              paddingLeft: 6,
              paddingRight: 6,
              color: colors.text,
              marginRight: 8,
            }}
            onChange={(e: any) => setQuery(e.value ?? '')}
          />

          <div
            onClick={() => setTranscriptMinimized(true)}
            style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icons.Minus size={13} color={colors.textSubtle} />
          </div>
          <div
            onClick={() => setTranscriptOpen(false)}
            style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icons.X size={13} color={colors.textSubtle} />
          </div>
        </div>

        {/* Segments content */}
        <div
          style={{
            flexGrow: 1,
            overflow: 'hidden',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {filtered.map((seg) => (
            <div key={seg.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <text style={{ fontSize: 11, fontWeight: '600', color: seg.speaker === 'me' ? colors.accent : colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {seg.speaker === 'me' ? 'You' : seg.speaker}
                </text>
                <text style={{ fontSize: 10, color: colors.textSubtle, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                  {formatElapsed(seg.start_ms)}
                </text>
              </div>
              <text style={{ fontSize: 12.5, color: colors.text, fontFamily: FONT_SANS }}>
                {seg.text}
              </text>
            </div>
          ))}
        </div>

        {/* Panel Footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            borderTopWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface2,
          }}
        >
          <RecordingControls noteId={noteId} />
          <div
            onClick={() => {
              const fullText = filtered.map((s) => `${s.speaker}: ${s.text}`).join('\n')
              try {
                navigator.clipboard?.writeText(fullText)
              } catch {}
            }}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              height: 26,
              paddingLeft: 8,
              paddingRight: 8,
              borderRadius: 6,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              cursor: 'pointer',
            }}
          >
            <Icons.Copy size={12} color={colors.textMuted} />
            <text style={{ fontSize: 11.5, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'Copy transcript'}
            </text>
          </div>
        </div>
      </div>
    </div>
  )
}
