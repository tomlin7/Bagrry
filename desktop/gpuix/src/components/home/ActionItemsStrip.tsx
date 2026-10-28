import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_SANS } from '../../theme'

export function ActionItemsStrip() {
  const actionItems = useBagrryStore((s) => s.actionItems)
  const toggleActionItem = useBagrryStore((s) => s.toggleActionItem)
  const openNote = useBagrryStore((s) => s.openNote)
  const colors = useBagrryStore((s) => s.colors)
  const [hoverItem, setHoverItem] = useState<string | null>(null)

  const openItems = actionItems.filter((item) => !item.done)
  if (openItems.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 28 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
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
      </div>

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
        {openItems.slice(0, 5).map((item, idx) => {
          const isHover = hoverItem === item.id
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoverItem(item.id)}
              onMouseLeave={() => setHoverItem(null)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                borderBottomWidth: idx === openItems.length - 1 ? 0 : 1,
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
                    color: colors.text,
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
