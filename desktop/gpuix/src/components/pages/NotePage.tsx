import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'
import { NoteEditor } from '../notes/NoteEditor'
import { EnhancedNotes } from '../notes/EnhancedNotes'
import { TranscriptPanel } from '../notes/TranscriptPanel'
import { RecordingControls } from '../notes/RecordingControls'
import { AskBar } from '../chat/AskBar'

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
  const addActionItem = useBagrryStore((s) => s.addActionItem)
  const deleteMeeting = useBagrryStore((s) => s.deleteMeeting)
  const duplicateMeeting = useBagrryStore((s) => s.duplicateMeeting)
  const moveMeeting = useBagrryStore((s) => s.moveMeeting)
  const sendChatMessage = useBagrryStore((s) => s.sendChatMessage)
  const colors = useBagrryStore((s) => s.colors)
  const transcriptOpen = useBagrryStore((s) => s.transcriptOpen)
  const setTranscriptOpen = useBagrryStore((s) => s.setTranscriptOpen)
  const recState = useBagrryStore((s) => s.recState)

  const [tab, setTab] = useState<'notes' | 'enhanced'>('notes')
  const [titleDraft, setTitleDraft] = useState(note?.title ?? '')
  const [scratchDraft, setScratchDraft] = useState(note?.scratchpad_raw ?? '')
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [showAttendeesPicker, setShowAttendeesPicker] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>(['Sarah Chen'])
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
  const hasEnhanced = Boolean(note.enhanced_notes_json)

  const showNotice = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
  }

  const handleTitleCommit = () => {
    if (titleDraft.trim() && titleDraft !== note.title) {
      saveTitle(noteId, titleDraft.trim())
      showNotice('Title saved')
    }
  }

  const handleScratchCommit = (val: string) => {
    setScratchDraft(val)
    saveScratchpad(noteId, val)
  }

  const handleEnhance = async () => {
    await enhanceMeeting(noteId)
    setTab('enhanced')
    showNotice('Notes enhanced with AI citations')
  }

  const handleExtractActions = () => {
    const lines = scratchDraft
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.\s]+/, '').trim())
      .filter((l) => l.length > 3)

    if (lines.length > 0) {
      for (const line of lines.slice(0, 3)) {
        addActionItem(noteId, line, 'You', '2026-11-05')
      }
      showNotice(`${Math.min(lines.length, 3)} action items added to Checklist`)
    } else {
      addActionItem(noteId, `Follow up on decisions from ${note.title}`, 'You', '2026-11-05')
      showNotice('Action item created')
    }
  }

  const handleDraftEmail = async () => {
    const prompt = `Draft a polite follow-up email for meeting "${note.title}" with attendees ${selectedAttendees.join(', ')} summarizing: ${scratchDraft}`
    await sendChatMessage(null, prompt)
    showNotice('Follow-up email prompt queued in Chat')
  }

  const handleExportMarkdown = () => {
    const md = `# ${note.title}\n\nDate: ${note.date}\nAttendees: ${selectedAttendees.join(', ')}\n\n## Notes\n\n${note.scratchpad_raw}`
    try {
      navigator.clipboard?.writeText(md)
    } catch {}
    showNotice('Markdown copied to clipboard')
  }

  const handleDuplicate = () => {
    duplicateMeeting(noteId)
    showNotice('Note duplicated')
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
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 8,
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icons.Check size={13} color={colors.accent} />
          <text style={{ fontSize: 12, fontWeight: '500', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
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
            gap: 14,
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
                gap: 5,
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
                gap: 5,
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
                {currentFolder?.name ?? 'Inbox'}
              </text>
              <Icons.ChevronDown size={10} color={colors.textSubtle} />
            </div>

            {/* Attendees Picker Chip */}
            <div
              onClick={() => setShowAttendeesPicker(!showAttendeesPicker)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
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
                {selectedAttendees.length > 0 ? selectedAttendees.join(', ') : 'Add attendees'}
              </text>
              <Icons.ChevronDown size={10} color={colors.textSubtle} />
            </div>

            <div style={{ flexGrow: 1 }} />

            {/* Mode Switcher Tabs: Notes vs Enhanced Notes */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                padding: 2,
              }}
            >
              <div
                testId="tab-notes"
                onClick={() => setTab('notes')}
                style={{
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 2,
                  paddingBottom: 2,
                  borderRadius: 9999,
                  backgroundColor: tab === 'notes' ? colors.hover : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <text
                  style={{
                    fontSize: 11,
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
                  gap: 3,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 2,
                  paddingBottom: 2,
                  borderRadius: 9999,
                  backgroundColor: tab === 'enhanced' ? colors.hover : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Icons.Sparkles size={11} color={tab === 'enhanced' ? colors.accent : colors.textSubtle} />
                <text
                  style={{
                    fontSize: 11,
                    fontWeight: tab === 'enhanced' ? '600' : '400',
                    color: tab === 'enhanced' ? colors.text : colors.textMuted,
                    fontFamily: FONT_SANS,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {'Enhanced'}
                </text>
              </div>
            </div>

            {/* Enhance Button */}
            <div
              testId="enhance-btn"
              onClick={handleEnhance}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                height: 24,
                paddingLeft: 8,
                paddingRight: 10,
                borderRadius: 9999,
                backgroundColor: colors.accentSubtle,
                borderWidth: 1,
                borderColor: colors.accent,
                cursor: 'pointer',
              }}
            >
              <Icons.Sparkles size={11} color={colors.accent} />
              <text style={{ fontSize: 11, fontWeight: '600', color: colors.accent, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Enhance'}
              </text>
            </div>

            {/* More Options Dropdown */}
            <div
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: showActionsMenu ? colors.hover : 'transparent',
              }}
            >
              <Icons.MoreHorizontal size={13} color={colors.textSubtle} />
            </div>
          </div>

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
                    showNotice(`Moved to ${f.name}`)
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

          {/* Attendees picker dropdown */}
          {showAttendeesPicker && (
            <div
              style={{
                width: 240,
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
              <div style={{ paddingLeft: 8, paddingTop: 2, paddingBottom: 4 }}>
                <text style={{ fontSize: 11, fontWeight: '600', color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Select attendees'}
                </text>
              </div>
              {people.map((p) => {
                const isSelected = selectedAttendees.includes(p.name)
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      const next = isSelected
                        ? selectedAttendees.filter((name) => name !== p.name)
                        : [...selectedAttendees, p.name]
                      setSelectedAttendees(next)
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      height: 28,
                      borderRadius: 6,
                      paddingLeft: 8,
                      paddingRight: 8,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? colors.surface2 : 'transparent',
                    }}
                  >
                    <Icons.User size={12} color={isSelected ? colors.accent : colors.textMuted} />
                    <text style={{ fontSize: 12, color: colors.text, fontFamily: FONT_SANS, flexGrow: 1, whiteSpace: 'nowrap' }}>
                      {p.name}
                    </text>
                    {isSelected && <Icons.Check size={12} color={colors.accent} />}
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions Menu */}
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
                  handleExportMarkdown()
                  setShowActionsMenu(false)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  height: 28,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <Icons.Download size={12} color={colors.textMuted} />
                <text style={{ fontSize: 12, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Copy Markdown'}
                </text>
              </div>
              <div
                onClick={() => {
                  handleDuplicate()
                  setShowActionsMenu(false)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  height: 28,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <Icons.Copy size={12} color={colors.textMuted} />
                <text style={{ fontSize: 12, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Duplicate note'}
                </text>
              </div>
              <div style={{ height: 1, backgroundColor: colors.border, marginTop: 2, marginBottom: 2 }} />
              <div
                onClick={() => {
                  deleteMeeting(noteId)
                  setShowActionsMenu(false)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  height: 28,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <Icons.Trash2 size={12} color={colors.danger} />
                <text style={{ fontSize: 12, color: colors.danger, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Delete note'}
                </text>
              </div>
            </div>
          )}

          {/* Main content body */}
          {tab === 'notes' ? (
            <NoteEditor
              noteId={noteId}
              content={scratchDraft}
              onChange={handleScratchCommit}
              onEnhance={handleEnhance}
              onExtractActions={handleExtractActions}
              onDraftEmail={handleDraftEmail}
            />
          ) : (
            <EnhancedNotes noteId={noteId} json={note.enhanced_notes_json} />
          )}
        </div>
      </div>

      {/* Slide-out floating transcript panel */}
      {transcriptOpen && <TranscriptPanel noteId={noteId} />}

      {/* Docked bottom composer + recording capsule (when transcript is closed) */}
      {!transcriptOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 16,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 680,
              paddingLeft: 24,
              paddingRight: 24,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              pointerEvents: 'auto',
            }}
          >
            {/* Recording Controls Capsule with Transcript toggle button */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surface,
                paddingLeft: 6,
                paddingRight: 10,
                paddingTop: 4,
                paddingBottom: 4,
                flexShrink: 0,
              }}
            >
              <RecordingControls noteId={noteId} compact />
              <div
                testId="open-transcript-btn"
                onClick={() => setTranscriptOpen(true)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <Icons.NotebookPen size={12} color={colors.textMuted} />
                <text
                  style={{
                    fontSize: 11.5,
                    color: colors.textMuted,
                    fontFamily: FONT_SANS,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {'Transcript'}
                </text>
              </div>
            </div>

            {/* AskBar filling remaining width */}
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <AskBar
                placeholder={recState !== 'idle' ? 'Ask about this live meeting…' : 'Ask anything…'}
                onSubmit={(content) => sendChatMessage(null, content)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
