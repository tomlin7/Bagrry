import React, { useState } from 'react'
import { AnimatePresence, motion } from '@gpuix/react'
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
      <AnimatePresence initial={false}>
        {transcriptMinimized ? (
          <motion.div
            key="minimized-pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ pointerEvents: 'auto' }}
          >
            <RecordingPill />
          </motion.div>
        ) : (
          <motion.div
            key="expanded-transcript"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 340 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: 580,
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
                {recordingStartedAt && recState !== 'idle' && (
                  <text style={{ fontSize: 11, fontFamily: FONT_MONO, color: colors.textSubtle, whiteSpace: 'nowrap' }}>
                    {`(${formatElapsed(Date.now() - recordingStartedAt)})`}
                  </text>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <div
                  testId="minimize-transcript-btn"
                  onClick={() => setTranscriptMinimized(true)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: hoverBtn === 'min' ? colors.hover : 'transparent',
                  }}
                  onMouseEnter={() => setHoverBtn('min')}
                  onMouseLeave={() => setHoverBtn(null)}
                >
                  <Icons.Minus size={14} color={colors.textMuted} />
                </div>
                <div
                  testId="close-transcript-btn"
                  onClick={() => setTranscriptOpen(false)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: hoverBtn === 'close' ? colors.hover : 'transparent',
                  }}
                  onMouseEnter={() => setHoverBtn('close')}
                  onMouseLeave={() => setHoverBtn(null)}
                >
                  <Icons.X size={14} color={colors.textMuted} />
                </div>
              </div>
            </div>

            {/* Controls Sub-bar */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderColor: colors.border,
                gap: 12,
                backgroundColor: colors.surface2,
              }}
            >
              <RecordingControls noteId={noteId} compact />
              <div style={{ flexGrow: 1 }}>
                <input
                  testId="transcript-search-input"
                  value={query}
                  placeholder="Search live transcript…"
                  onChange={(e: any) => setQuery(e.value ?? '')}
                  style={{
                    height: 26,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    paddingLeft: 8,
                    paddingRight: 8,
                    fontSize: 12,
                    color: colors.text,
                    fontFamily: FONT_SANS,
                  }}
                />
              </div>
            </div>

            {/* Transcript lines list */}
            <div
              testId="transcript-scroll-area"
              style={{
                flexGrow: 1,
                overflowY: 'scroll',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {filtered.length === 0 ? (
                <div style={{ padding: 16, alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                  <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {recState === 'recording' ? 'Listening and transcribing audio…' : 'No transcript recorded yet'}
                  </text>
                </div>
              ) : (
                filtered.map((seg) => {
                  const isMe = seg.speaker === 'me'
                  return (
                    <div
                      key={seg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        paddingLeft: 6,
                        borderLeftWidth: 2,
                        borderColor: isMe ? colors.accent : colors.borderStrong,
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <text
                          style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: isMe ? colors.accent : colors.textMuted,
                            fontFamily: FONT_SANS,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isMe ? 'You' : 'Attendee'}
                        </text>
                        <text style={{ fontSize: 10, fontFamily: FONT_MONO, color: colors.textSubtle, whiteSpace: 'nowrap' }}>
                          {formatElapsed(seg.start_ms)}
                        </text>
                      </div>
                      <text style={{ fontSize: 12.5, color: colors.text, fontFamily: FONT_SANS, lineHeight: 1.4 }}>
                        {seg.text}
                      </text>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
