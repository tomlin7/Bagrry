import React, { useEffect, useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { handleTitlebarMouseDown } from '../../window-drag'
import { Icons } from '../icons'
import { WindowControls } from './WindowControls'
import { FONT_SANS } from '../../theme'

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TitleBar() {
  const route = useBagrryStore((s) => s.route)
  const history = useBagrryStore((s) => s.history)
  const back = useBagrryStore((s) => s.back)
  const sidebarOpen = useBagrryStore((s) => s.sidebarOpen)
  const toggleSidebar = useBagrryStore((s) => s.toggleSidebar)
  const recState = useBagrryStore((s) => s.recState)
  const recordingStartedAt = useBagrryStore((s) => s.recordingStartedAt)
  const recordingMeetingId = useBagrryStore((s) => s.recordingMeetingId)
  const openNote = useBagrryStore((s) => s.openNote)
  const createMeeting = useBagrryStore((s) => s.createMeeting)
  const colors = useBagrryStore((s) => s.colors)

  const [hoverBtn, setHoverBtn] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState('0:00')

  useEffect(() => {
    if (recState === 'idle' || !recordingStartedAt) return
    const interval = setInterval(() => {
      setElapsed(formatElapsed(Date.now() - recordingStartedAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [recState, recordingStartedAt])

  const showNewNote = route.kind === 'home' || route.kind === 'space' || route.kind === 'shared'

  if (route.kind === 'settings') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: 44,
          alignItems: 'center',
          paddingLeft: 12,
          paddingRight: 0,
          borderBottomWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bg,
          position: 'relative',
        }}
      >
        <div
          testId="titlebar-back"
          onClick={back}
          onMouseEnter={() => setHoverBtn('back')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: hoverBtn === 'back' ? colors.hover : colors.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icons.ChevronLeft size={16} color={hoverBtn === 'back' ? colors.text : colors.textMuted} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.text,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Settings'}
          </text>
        </div>

        {/* Drag handle */}
        <div
          testId="titlebar-drag-header"
          style={{ flexGrow: 1, height: '100%' }}
          onMouseDown={(e: any) => handleTitlebarMouseDown(undefined, e)}
        />

        <WindowControls />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: 44,
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 0,
        gap: 8,
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        flexShrink: 0,
      }}
    >
      {/* Back and Sidebar toggle pill */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: 2,
        }}
      >
        {history.length > 0 && (
          <div
            testId="titlebar-back"
            onClick={back}
            onMouseEnter={() => setHoverBtn('back')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: hoverBtn === 'back' ? colors.hover : 'transparent',
            }}
          >
            <Icons.ChevronLeft size={14} color={hoverBtn === 'back' ? colors.text : colors.textMuted} />
          </div>
        )}
        <div
          testId="toggle-sidebar"
          onClick={toggleSidebar}
          onMouseEnter={() => setHoverBtn('sidebar')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: hoverBtn === 'sidebar' ? colors.hover : 'transparent',
          }}
        >
          <Icons.PanelLeft size={14} color={sidebarOpen ? colors.text : colors.textMuted} />
        </div>
      </div>

      {/* Recording Pill */}
      {recState !== 'idle' && (
        <div
          testId="recording-pill"
          onClick={() => recordingMeetingId && openNote(recordingMeetingId)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 9999,
            backgroundColor: colors.dangerSubtle,
            borderWidth: 1,
            borderColor: colors.danger,
            paddingLeft: 8,
            paddingRight: 10,
            paddingTop: 3,
            paddingBottom: 3,
            cursor: 'pointer',
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
              fontSize: 11.5,
              fontWeight: '600',
              color: colors.danger,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {recState === 'paused' ? `Paused (${elapsed})` : `Recording (${elapsed})`}
          </text>
        </div>
      )}

      {/* Empty space for window dragging */}
      <div
        testId="titlebar-drag-header"
        style={{ flexGrow: 1, height: '100%' }}
        onMouseDown={(e: any) => handleTitlebarMouseDown(undefined, e)}
      />

      {/* + New note solid pill button */}
      {showNewNote && (
        <div
          testId="titlebar-new-note"
          onClick={() => createMeeting()}
          onMouseEnter={() => setHoverBtn('new_note')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 28,
            paddingLeft: 10,
            paddingRight: 12,
            borderRadius: 9999,
            backgroundColor: hoverBtn === 'new_note' ? '#ffffff' : colors.solid,
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          <Icons.Plus size={14} color={colors.solidFg} />
          <text
            style={{
              fontSize: 12.5,
              fontWeight: '600',
              color: colors.solidFg,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'New note'}
          </text>
        </div>
      )}

      {/* Window Controls */}
      <WindowControls />
    </div>
  )
}
