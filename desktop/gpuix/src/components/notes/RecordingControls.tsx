import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { VuMeter } from './VuMeter'

interface RecordingControlsProps {
  noteId: string
  compact?: boolean
}

export function RecordingControls({ noteId, compact = false }: RecordingControlsProps) {
  const recState = useBagrryStore((s) => s.recState)
  const startRecording = useBagrryStore((s) => s.startRecording)
  const pauseRecording = useBagrryStore((s) => s.pauseRecording)
  const stopRecording = useBagrryStore((s) => s.stopRecording)
  const discardAudio = useBagrryStore((s) => s.discardAudio)
  const colors = useBagrryStore((s) => s.colors)
  const [hoverBtn, setHoverBtn] = useState<string | null>(null)

  const isIdle = recState === 'idle'

  if (isIdle) {
    return (
      <div
        testId="start-recording-btn"
        onClick={() => startRecording(noteId)}
        onMouseEnter={() => setHoverBtn('start')}
        onMouseLeave={() => setHoverBtn(null)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 9999,
          backgroundColor: colors.danger,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Icons.Mic size={15} color="#ffffff" />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <VuMeter />

      {/* Pause / Resume button */}
      <div
        testId="panel-pause-recording-btn"
        onClick={pauseRecording}
        onMouseEnter={() => setHoverBtn('pause')}
        onMouseLeave={() => setHoverBtn(null)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          backgroundColor: hoverBtn === 'pause' ? colors.hover : colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {recState === 'paused' ? (
          <Icons.Play size={13} color={colors.text} />
        ) : (
          <Icons.Pause size={13} color={colors.text} />
        )}
      </div>

      {/* Stop button */}
      <div
        testId="panel-stop-recording-btn"
        onClick={stopRecording}
        onMouseEnter={() => setHoverBtn('stop')}
        onMouseLeave={() => setHoverBtn(null)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          backgroundColor: colors.danger,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icons.Square size={12} color="#ffffff" />
      </div>

      {/* Discard button */}
      {!compact && (
        <div
          testId="panel-discard-recording-btn"
          onClick={discardAudio}
          onMouseEnter={() => setHoverBtn('discard')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: hoverBtn === 'discard' ? colors.hover : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icons.Trash2 size={13} color={colors.textMuted} />
        </div>
      )}
    </div>
  )
}
