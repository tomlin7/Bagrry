import React from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'
import { NoteList } from '../notes/NoteList'

export function SharedPage() {
  const folders = useBagrryStore((s) => s.folders)
  const meetings = useBagrryStore((s) => s.meetings)
  const colors = useBagrryStore((s) => s.colors)

  const sharedFolderIds = new Set(folders.filter((f) => f.is_shared).map((f) => f.id))
  const sharedNotes = meetings.filter((m) => m.folder_id && sharedFolderIds.has(m.folder_id))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        overflow: 'hidden',
        paddingTop: 32,
        alignItems: 'center',
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
          alignItems: 'center',
          gap: 24,
        }}
      >
        {/* Header centered matching Tauri */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.hover,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icons.Users size={16} color={colors.textMuted} />
          </div>
          <text
            style={{
              fontSize: 28,
              fontFamily: FONT_DISPLAY,
              fontWeight: '600',
              color: colors.text,
              whiteSpace: 'nowrap',
            }}
          >
            {'Shared with me'}
          </text>
          <text
            style={{
              fontSize: 13,
              color: colors.textSubtle,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Notes teammates have shared into your workspace.'}
          </text>
        </div>

        <div style={{ width: '100%' }}>
          <NoteList notes={sharedNotes} emptyMessage="Nothing shared with you yet. When a teammate shares a note or folder, it shows up here." />
        </div>
      </div>
    </div>
  )
}
