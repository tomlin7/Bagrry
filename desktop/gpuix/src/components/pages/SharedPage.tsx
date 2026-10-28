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
        paddingTop: 24,
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
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 16, borderBottomWidth: 1, borderColor: colors.border }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icons.Users size={18} color={colors.text} />
            <text style={{ fontSize: 22, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Shared with me'}
            </text>
          </div>
          <text style={{ fontSize: 13, color: colors.textSubtle, fontFamily: FONT_SANS }}>
            {'Notes and meeting summaries shared with you by teammates.'}
          </text>
        </div>

        <NoteList notes={sharedNotes} emptyMessage="No shared notes yet." />
      </div>
    </div>
  )
}
