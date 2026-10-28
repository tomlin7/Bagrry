import React, { useEffect, useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_SANS } from '../../theme'

function formatElapsed(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function RecordingPill() {
  const recState = useBagrryStore((s) => s.recState)
  const recordingStartedAt = useBagrryStore((s) => s.recordingStartedAt)
  const pauseRecording = useBagrryStore((s) => s.pauseRecording)
  const stopRecording = useBagrryStore((s) => s.stopRecording)
  const discardAudio = useBagrryStore((s) => s.discardAudio)
  const setTranscriptOpen = useBagrryStore((s) => s.setTranscriptOpen)
  const setTranscriptMinimized = useBagrryStore((s) => s.setTranscriptMinimized)
  const vu = useBagrryStore((s) => s.vu)
  const colors = useBagrryStore((s) => s.colors)

  const [elapsed, setElapsed] = useState('0:00')
  const [hoverBtn, setHoverBtn] = useState<string | null>(null)

  useEffect(() => {
    if (recState === 'idle' || !recordingStartedAt) return
    const update = () => {
      setElapsed(formatElapsed(Date.now() - recordingStartedAt))
    }
    update()
    const timer = setInterval(update, 500)
    return () => clearInterval(timer)
  }, [recState, recordingStartedAt])

  if (recState === 'idle') return null

  // VU meter bar widths (out of 32px track max width)
  const micWidth = recState === 'recording' ? Math.min(32, Math.max(6, Math.round(vu.mic * 32))) : 6
  const sysWidth = recState === 'recording' ? Math.min(32, Math.max(6, Math.round(vu.system * 32))) : 6

  return (
    <div
      testId="recording-pill"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 38,
        paddingLeft: 8,
        paddingRight: 10,
        borderRadius: 9999,
        backgroundColor: '#272725',
        borderWidth: 1,
        borderColor: '#3a3a37',
        pointerEvents: 'auto',
      }}
    >
      {/* 1. Dual horizontal VU meter box */}
      <div
        testId="pill-vu-meter"
        style={{
          width: 44,
          height: 24,
          borderRadius: 6,
          backgroundColor: '#1b1b1a',
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 5,
          paddingBottom: 5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top bar: Microphone (lime yellow #c3dd4f) */}
        <div
          style={{
            width: 32,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: '#2a2a28',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: micWidth,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: '#c3dd4f',
            }}
          />
        </div>

        {/* Bottom bar: System audio (soft green #7bd88f) */}
        <div
          style={{
            width: 32,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: '#2a2a28',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: sysWidth,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: '#7bd88f',
            }}
          />
        </div>
      </div>

      {/* 2. Pause / Resume Button */}
      <div
        testId="pause-recording-btn"
        onClick={pauseRecording}
        onMouseEnter={() => setHoverBtn('pause')}
        onMouseLeave={() => setHoverBtn(null)}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          backgroundColor: hoverBtn === 'pause' ? '#323230' : '#20201f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {recState === 'paused' ? (
          <Icons.Play size={10} color="#ffffff" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'row', gap: 2.5, alignItems: 'center' }}>
            <div style={{ width: 2, height: 9, borderRadius: 1, backgroundColor: '#ffffff' }} />
            <div style={{ width: 2, height: 9, borderRadius: 1, backgroundColor: '#ffffff' }} />
          </div>
        )}
      </div>

      {/* 3. Stop Button (coral red #e05252 with hollow white square) */}
      <div
        testId="stop-recording-btn"
        onClick={stopRecording}
        onMouseEnter={() => setHoverBtn('stop')}
        onMouseLeave={() => setHoverBtn(null)}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          backgroundColor: hoverBtn === 'stop' ? '#ea5c5c' : '#e05252',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: 1.5,
            borderWidth: 1.5,
            borderColor: '#ffffff',
            backgroundColor: '#00000000',
          }}
        />
      </div>

      {/* 4. Status Text & Timer (click to expand transcript) */}
      <div
        onClick={() => {
          setTranscriptOpen(true)
          setTranscriptMinimized(false)
        }}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 2,
          paddingRight: 4,
          cursor: 'pointer',
        }}
      >
        <text
          style={{
            fontSize: 12,
            fontWeight: '400',
            color: '#dddddd',
            fontFamily: FONT_SANS,
            whiteSpace: 'nowrap',
          }}
        >
          {recState === 'paused' ? 'Paused' : 'Live Transcribing...'}
        </text>
        <text
          style={{
            fontSize: 12,
            color: '#888888',
            fontFamily: FONT_SANS,
            whiteSpace: 'nowrap',
          }}
        >
          {elapsed}
        </text>
      </div>

      {/* 5. Close / Discard 'x' Button */}
      <div
        testId="discard-recording-btn"
        onClick={discardAudio}
        onMouseEnter={() => setHoverBtn('discard')}
        onMouseLeave={() => setHoverBtn(null)}
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          backgroundColor: hoverBtn === 'discard' ? '#333331' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icons.X size={12} color={hoverBtn === 'discard' ? '#ffffff' : '#888888'} />
      </div>
    </div>
  )
}
