import React, { useEffect, useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { FONT_MONO, FONT_SANS } from '../../theme'

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function LiveMeetingIndicator() {
  const recState = useBagrryStore((s) => s.recState)
  const recordingStartedAt = useBagrryStore((s) => s.recordingStartedAt)
  const colors = useBagrryStore((s) => s.colors)

  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (recState === 'idle') return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [recState])

  if (recState === 'idle') return null

  const elapsed = recordingStartedAt ? formatElapsed(Date.now() - recordingStartedAt) : '0:00'

  return (
    <div
      style={{
        position: 'absolute',
        right: 18,
        top: 360,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.elevated,
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 6,
          paddingBottom: 6,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: 9999,
            backgroundColor: colors.danger,
          }}
        />
        <text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.text,
            fontFamily: FONT_SANS,
            whiteSpace: 'nowrap',
          }}
        >
          {recState === 'paused' ? 'Paused' : 'Recording'}
        </text>
        <text
          style={{
            fontSize: 11,
            color: colors.textSubtle,
            fontFamily: FONT_MONO,
            whiteSpace: 'nowrap',
          }}
        >
          {elapsed}
        </text>
      </div>
    </div>
  )
}
