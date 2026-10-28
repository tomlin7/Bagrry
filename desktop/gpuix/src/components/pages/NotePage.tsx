import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'
import { EnhancedNotes } from '../notes/EnhancedNotes'
import { TranscriptPanel } from '../notes/TranscriptPanel'
import { RecordingControls } from '../notes/RecordingControls'

interface NotePageProps {
  noteId: string
}

export function NotePage({ noteId }: NotePageProps) {
  const note = useBagrryStore((s) => s.meetings.find((m) => m.id === noteId))
  const folders = useBagrryStore((s) => s.folders)
  const people = useBagrryStore((s) => s.people)
  const saveTitle = useBagrryStore((s) => s.saveTitle)
  const saveScratchpad = useBagrryStore((s) => s.saveScratchpad)
  const enhanceMeeting = useBagrryStore((s) => s.enhanceMeeting)
  const deleteMeeting = useBagrryStore((s) => s.deleteMeeting)
  const moveMeeting = useBagrryStore((s) => s.moveMeeting)
  const colors = useBagrryStore((s) => s.colors)
  const transcriptOpen = useBagrryStore((s) => s.transcriptOpen)

  const [tab, setTab] = useState<'notes' | 'enhanced'>('notes')
  const [titleDraft, setTitleDraft] = useState(note?.title ?? '')
  const [scratchDraft, setScratchDraft] = useState(note?.scratchpad_raw ?? '')
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [showAttendeesPicker, setShowAttendeesPicker] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  if (!note) {
    return (
      <div style={{ padding: 32 }}>
        <text style={{ fontSize: 14, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
          {'Note not found.'}
        </text>
      </div>
    )
  }

  const currentFolder = folders.find((f) => f.id === note.folder_id)

  const handleTitleCommit = () => {
    if (titleDraft.trim() && titleDraft !== note.title) {
      saveTitle(noteId, titleDraft.trim())
    }
  }

  const handleScratchCommit = (val: string) => {
    setScratchDraft(val)
    saveScratchpad(noteId, val)
  }

  const handleEnhance = async () => {
    await enhanceMeeting(noteId)
    setTab('enhanced')
    setNotification('Notes enhanced by AI')
    setTimeout(() => setNotification(null), 2500)
  }

  const handleExportMarkdown = () => {
    const md = `# ${note.title}\n\nDate: ${note.date}\n\n## Notes\n\n${note.scratchpad_raw}`
    try {
      navigator.clipboard?.writeText(md)
    } catch {}
    setNotification('Markdown copied to clipboard')
    setTimeout(() => setNotification(null), 2500)
  }

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
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 24,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 8,
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.borderStrong,
          }}
        >
          <text style={{ fontSize: 12, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
            {notification}
          </text>
        </div>
      )}

      {/* Main editor scroll area */}
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
            maxWidth: 680,
            paddingLeft: 24,
            paddingRight: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Editable Title */}
          <input
            testId="note-title-input"
            value={titleDraft}
            placeholder="Untitled note"
            style={{
              fontSize: 26,
              fontFamily: FONT_DISPLAY,
              fontWeight: '600',
              color: colors.text,
              backgroundColor: '#00000000',
              borderWidth: 0,
              padding: 0,
            }}
            onChange={(e: any) => setTitleDraft(e.value ?? '')}
            onSubmit={handleTitleCommit}
          />

          {/* Metadata Chips Strip */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Date chip */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                height: 24,
                paddingLeft: 8,
                paddingRight: 8,
                borderRadius: 9999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Icons.CalendarDays size={12} color={colors.textSubtle} />
              <text style={{ fontSize: 11, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {note.date.slice(0, 10)}
              </text>
            </div>

            {/* Folder Picker Chip */}
            <div
              onClick={() => setShowFolderPicker(!showFolderPicker)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                height: 24,
                paddingLeft: 8,
                paddingRight: 8,
                borderRadius: 9999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                cursor: 'pointer',
              }}
            >
              <Icons.Folder size={12} color={colors.textSubtle} />
              <text style={{ fontSize: 11, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {currentFolder ? currentFolder.name : 'General'}
              </text>
            </div>

            {/* Attendees Chip */}
            <div
              onClick={() => setShowAttendeesPicker(!showAttendeesPicker)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                height: 24,
                paddingLeft: 8,
                paddingRight: 8,
                borderRadius: 9999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                cursor: 'pointer',
              }}
            >
              <Icons.Users size={12} color={colors.textSubtle} />
              <text style={{ fontSize: 11, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Add people'}
              </text>
            </div>

            {/* AI Enhance Action Chip */}
            <div
              testId="enhance-note-btn"
              onClick={handleEnhance}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                height: 24,
                paddingLeft: 8,
                paddingRight: 8,
                borderRadius: 9999,
                backgroundColor: colors.accentSubtle,
                borderWidth: 1,
                borderColor: colors.accent,
                cursor: 'pointer',
              }}
            >
              <Icons.Sparkles size={12} color={colors.accent} />
              <text style={{ fontSize: 11, fontWeight: '600', color: colors.accent, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Enhance'}
              </text>
            </div>

            {/* Action menu trigger */}
            <div
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: colors.surface,
              }}
            >
              <Icons.MoreHorizontal size={14} color={colors.textMuted} />
            </div>
          </div>

          {/* Actions popup dropdown */}
          {showActionsMenu && (
            <div
              style={{
                width: 200,
                borderRadius: 10,
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div
                onClick={() => {
                  setShowActionsMenu(false)
                  handleExportMarkdown()
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  height: 28,
                  borderRadius: 6,
                  paddingLeft: 8,
                  cursor: 'pointer',
                }}
              >
                <Icons.Download size={13} color={colors.textMuted} />
                <text style={{ fontSize: 12, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Export Markdown'}
                </text>
              </div>

              <div
                onClick={() => {
                  setShowActionsMenu(false)
                  deleteMeeting(noteId)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  height: 28,
                  borderRadius: 6,
                  paddingLeft: 8,
                  cursor: 'pointer',
                }}
              >
                <Icons.Trash2 size={13} color={colors.danger} />
                <text style={{ fontSize: 12, color: colors.danger, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Delete note'}
                </text>
              </div>
            </div>
          )}

          {/* Folder picker dropdown */}
          {showFolderPicker && (
            <div
              style={{
                width: 220,
                borderRadius: 10,
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {folders.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    moveMeeting(noteId, f.id)
                    setShowFolderPicker(false)
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    height: 28,
                    borderRadius: 6,
                    paddingLeft: 8,
                    cursor: 'pointer',
                  }}
                >
                  <Icons.Folder size={12} color={colors.textMuted} />
                  <text style={{ fontSize: 12, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {f.name}
                  </text>
                </div>
              ))}
            </div>
          )}

          {/* Mode Switcher Tabs: Notes vs Enhanced Notes */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderBottomWidth: 1,
              borderColor: colors.border,
              paddingBottom: 6,
              marginTop: 6,
            }}
          >
            <div
              testId="tab-notes"
              onClick={() => setTab('notes')}
              style={{
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 6,
                backgroundColor: tab === 'notes' ? colors.surface2 : 'transparent',
                cursor: 'pointer',
              }}
            >
              <text
                style={{
                  fontSize: 12.5,
                  fontWeight: tab === 'notes' ? '600' : '400',
                  color: tab === 'notes' ? colors.text : colors.textMuted,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {'Notes'}
              </text>
            </div>

            <div
              testId="tab-enhanced"
              onClick={() => setTab('enhanced')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 6,
                backgroundColor: tab === 'enhanced' ? colors.surface2 : 'transparent',
                cursor: 'pointer',
              }}
            >
              <Icons.Sparkles size={12} color={tab === 'enhanced' ? colors.accent : colors.textSubtle} />
              <text
                style={{
                  fontSize: 12.5,
                  fontWeight: tab === 'enhanced' ? '600' : '400',
                  color: tab === 'enhanced' ? colors.text : colors.textMuted,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {'Enhanced Notes'}
              </text>
            </div>
          </div>

          {/* Main content body */}
          {tab === 'notes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                testId="note-scratchpad-input"
                value={scratchDraft}
                placeholder="Write notes or talking points here…"
                style={{
                  minHeight: 180,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  fontFamily: FONT_SANS,
                }}
                onChange={(e: any) => handleScratchCommit(e.value ?? '')}
              />
            </div>
          ) : (
            <EnhancedNotes noteId={noteId} json={note.enhanced_notes_json} />
          )}
        </div>
      </div>

      {/* Slide-out floating transcript panel */}
      <TranscriptPanel noteId={noteId} />

      {/* Floating Bottom Recording Bar (when panel is closed) */}
      {!transcriptOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 28,
          }}
        >
          <RecordingControls noteId={noteId} />
        </div>
      )}
    </div>
  )
}
