import React from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { ComingUp } from '../home/ComingUp'
import { ActionItemsStrip } from '../home/ActionItemsStrip'
import { NoteList } from '../notes/NoteList'
import { AskBar } from '../chat/AskBar'

export function HomePage() {
  const meetings = useBagrryStore((s) => s.meetings)
  const colors = useBagrryStore((s) => s.colors)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable container */}
      <div
        style={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: 120,
          paddingTop: 16,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 720,
            paddingLeft: 24,
            paddingRight: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ComingUp />
          <ActionItemsStrip />
          <NoteList notes={meetings} emptyMessage="Your meeting notes will appear here." />
        </div>
      </div>

      {/* Docked composer at bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: 16,
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        <div style={{ width: '100%', maxWidth: 720, paddingLeft: 24, paddingRight: 24 }}>
          <AskBar placeholder="Continue chat" />
        </div>
      </div>
    </div>
  )
}
