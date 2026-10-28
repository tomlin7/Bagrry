import React from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'
import { NoteList } from '../notes/NoteList'
import { AskBar } from '../chat/AskBar'
import { MY_NOTES_SPACE, TEAM_SPACE } from '../../types'

interface SpacePageProps {
  spaceId: string
}

export function SpacePage({ spaceId }: SpacePageProps) {
  const folders = useBagrryStore((s) => s.folders)
  const allMeetings = useBagrryStore((s) => s.meetings)
  const createMeeting = useBagrryStore((s) => s.createMeeting)
  const profile = useBagrryStore((s) => s.profile)
  const colors = useBagrryStore((s) => s.colors)

  const folder = folders.find((f) => f.id === spaceId)
  const isMyNotes = spaceId === MY_NOTES_SPACE
  const isTeam = spaceId === TEAM_SPACE

  const sharedFolderIds = new Set(folders.filter((f) => f.is_shared).map((f) => f.id))

  const notes = isMyNotes
    ? allMeetings.filter((m) => !m.folder_id || !sharedFolderIds.has(m.folder_id))
    : isTeam
      ? allMeetings.filter((m) => m.folder_id && sharedFolderIds.has(m.folder_id))
      : allMeetings.filter((m) => m.folder_id === spaceId)

  const title = isMyNotes ? 'My notes' : isTeam ? `${profile.workspace} team` : folder?.name ?? 'Space'
  const description = isMyNotes
    ? 'All of your private notes and folders, visible only to you.'
    : isTeam
      ? 'Notes shared with teammates across your workspace.'
      : folder?.description ?? 'Space notes and documentation.'

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
      <div
        style={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 24,
          paddingBottom: 120,
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
          {/* Header Banner */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {isMyNotes ? (
                  <Icons.Lock size={18} color={colors.text} />
                ) : isTeam ? (
                  <Icons.Users size={18} color={colors.text} />
                ) : (
                  <Icons.Folder size={18} color={colors.text} />
                )}
                <text
                  style={{
                    fontSize: 22,
                    fontFamily: FONT_DISPLAY,
                    fontWeight: '600',
                    color: colors.text,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </text>
              </div>
              <text style={{ fontSize: 13, color: colors.textSubtle, fontFamily: FONT_SANS }}>
                {description}
              </text>
            </div>

            {/* + New note in space */}
            <div
              onClick={() => createMeeting('Untitled note', isMyNotes || isTeam ? null : spaceId)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                height: 28,
                paddingLeft: 10,
                paddingRight: 12,
                borderRadius: 9999,
                backgroundColor: colors.solid,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Icons.Plus size={13} color={colors.solidFg} />
              <text style={{ fontSize: 12, fontWeight: '600', color: colors.solidFg, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'New note'}
              </text>
            </div>
          </div>

          {/* Notes list */}
          <NoteList notes={notes} emptyMessage={`No notes found in ${title}.`} />
        </div>
      </div>

      {/* Docked composer */}
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
          <AskBar placeholder={`Ask anything about ${title}`} />
        </div>
      </div>
    </div>
  )
}
