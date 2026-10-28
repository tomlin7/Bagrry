import React, { useState } from 'react'
import { AnimatePresence, motion } from '@gpuix/react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_SANS } from '../../theme'

export function ActionItemsStrip() {
  const actionItems = useBagrryStore((s) => s.actionItems)
  const toggleActionItem = useBagrryStore((s) => s.toggleActionItem)
  const deleteActionItem = useBagrryStore((s) => s.deleteActionItem)
  const addActionItem = useBagrryStore((s) => s.addActionItem)
  const meetings = useBagrryStore((s) => s.meetings)
  const openNote = useBagrryStore((s) => s.openNote)
  const colors = useBagrryStore((s) => s.colors)

  const [hoverItem, setHoverItem] = useState<string | null>(null)
  const [newActionDraft, setNewActionDraft] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const openItems = actionItems.filter((item) => !item.done)
  const completedItems = actionItems.filter((item) => item.done)

  const handleAdd = () => {
    if (!newActionDraft.trim()) return
    const primaryMeetingId = meetings[0]?.id || 'note_general'
    addActionItem(primaryMeetingId, newActionDraft.trim(), 'You')
    setNewActionDraft('')
    setShowInput(false)
  }

  const displayedItems = showCompleted ? actionItems : openItems

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 28 }}>
      {/* Header with Title and Actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icons.CheckSquare size={14} color={colors.textMuted} />
          <text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.text,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Action items'}
          </text>
          <div
            style={{
              paddingLeft: 6,
              paddingRight: 6,
              paddingTop: 1,
              paddingBottom: 1,
              borderRadius: 4,
              backgroundColor: colors.surface2,
            }}
          >
            <text
              style={{
                fontSize: 10.5,
                fontWeight: '600',
                color: colors.textSubtle,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {`${openItems.length}`}
            </text>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {completedItems.length > 0 && (
            <div
              onClick={() => setShowCompleted(!showCompleted)}
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 6,
                paddingRight: 6,
                paddingTop: 2,
                paddingBottom: 2,
                borderRadius: 4,
                cursor: 'pointer',
                backgroundColor: showCompleted ? colors.hover : 'transparent',
              }}
            >
              <text
                style={{
                  fontSize: 11,
                  color: colors.textSubtle,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {showCompleted ? 'Hide completed' : `Show completed (${completedItems.length})`}
              </text>
            </div>
          )}

          <div
            onClick={() => setShowInput(!showInput)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 3,
              paddingBottom: 3,
              borderRadius: 6,
              backgroundColor: colors.surface2,
              cursor: 'pointer',
            }}
          >
            <Icons.Plus size={11} color={colors.text} />
            <text
              style={{
                fontSize: 11,
                fontWeight: '500',
                color: colors.text,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {'Add action'}
            </text>
          </div>
        </div>
      </div>

      {/* Main card list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        }}
      >
        {/* Inline Add Input */}
        {showInput && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 12,
              paddingRight: 10,
              paddingTop: 8,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface2,
              gap: 8,
            }}
          >
            <Icons.Plus size={14} color={colors.accent} />
            <input
              testId="new-action-input"
              value={newActionDraft}
              placeholder="Type new action item and press Enter..."
              style={{
                flexGrow: 1,
                fontSize: 13,
                color: colors.text,
                backgroundColor: '#00000000',
                borderWidth: 0,
                fontFamily: FONT_SANS,
              }}
              onChange={(e: any) => setNewActionDraft(e.value ?? '')}
              onSubmit={handleAdd}
            />
            <div
              onClick={handleAdd}
              style={{
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 3,
                paddingBottom: 3,
                borderRadius: 5,
                backgroundColor: colors.accent,
                cursor: 'pointer',
              }}
            >
              <text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.accentFg,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {'Save'}
              </text>
            </div>
          </div>
        )}

        {displayedItems.length === 0 && !showInput && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 18,
              gap: 8,
            }}
          >
            <Icons.Check size={14} color={colors.textSubtle} />
            <text style={{ fontSize: 12.5, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'All action items completed'}
            </text>
          </div>
        )}

        <AnimatePresence initial={false}>
          {displayedItems.map((item, idx) => {
            const isHover = hoverItem === item.id
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                onMouseEnter={() => setHoverItem(item.id)}
                onMouseLeave={() => setHoverItem(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 9,
                  paddingBottom: 9,
                  borderBottomWidth: idx === displayedItems.length - 1 ? 0 : 1,
                  borderColor: colors.border,
                  backgroundColor: isHover ? colors.hover : 'transparent',
                }}
              >
                {/* Checkbox button */}
                <div
                  testId={`action-toggle-${item.id}`}
                  onClick={() => toggleActionItem(item.id)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: item.done ? colors.accent : colors.borderStrong,
                    backgroundColor: item.done ? colors.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {item.done && <Icons.Check size={12} color={colors.accentFg} />}
                </div>

                {/* Note link & details */}
                <div
                  onClick={() => openNote(item.meeting_id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    minWidth: 0,
                    cursor: 'pointer',
                  }}
                >
                  <text
                    style={{
                      fontSize: 13,
                      color: item.done ? colors.textSubtle : colors.text,
                      fontFamily: FONT_SANS,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.task}
                  </text>
                  <text
                    style={{
                      fontSize: 11,
                      color: colors.textSubtle,
                      fontFamily: FONT_SANS,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`${item.meeting_title}${item.owner ? ` · ${item.owner}` : ''}${item.deadline ? ` · ${item.deadline}` : ''}`}
                  </text>
                </div>

                {/* Delete action item */}
                {isHover && (
                  <div
                    testId={`action-delete-${item.id}`}
                    onClick={(e: any) => {
                      e.stopPropagation?.()
                      deleteActionItem(item.id)
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: colors.hover,
                    }}
                  >
                    <Icons.Trash2 size={12} color={colors.danger} />
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
