import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'
import type { EnhancedDoc } from '../../types'

interface EnhancedNotesProps {
  noteId: string
  json: string | null
}

export function EnhancedNotes({ noteId, json }: EnhancedNotesProps) {
  const colors = useBagrryStore((s) => s.colors)
  const liveSegments = useBagrryStore((s) => s.liveSegments)
  const [activeCitation, setActiveCitation] = useState<string | null>(null)

  let doc: EnhancedDoc | null = null
  try {
    if (json) doc = JSON.parse(json)
  } catch {}

  if (!doc || !Array.isArray(doc.sections)) {
    return (
      <div style={{ padding: 16 }}>
        <text style={{ fontSize: 13, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
          {'No enhanced notes generated yet. Click "Enhance" to generate structured AI notes.'}
        </text>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {doc.sections.map((section, sIdx) => (
        <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <text
            style={{
              fontSize: 15,
              fontWeight: '600',
              fontFamily: FONT_DISPLAY,
              color: colors.text,
              whiteSpace: 'nowrap',
            }}
          >
            {section.section_title}
          </text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {section.bullet_points.map((bullet, bIdx) => (
              <div
                key={bIdx}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 9999,
                    backgroundColor: colors.textSubtle,
                    marginTop: 8,
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                    <text
                      style={{
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        color: colors.text,
                        fontFamily: FONT_SANS,
                      }}
                    >
                      {bullet.text}
                    </text>
                    {bullet.citations?.map((citId) => (
                      <div
                        key={citId}
                        onClick={() => setActiveCitation(activeCitation === citId ? null : citId)}
                        style={{
                          paddingLeft: 4,
                          paddingRight: 4,
                          paddingTop: 1,
                          paddingBottom: 1,
                          borderRadius: 4,
                          backgroundColor: activeCitation === citId ? colors.accent : colors.accentSubtle,
                          cursor: 'pointer',
                        }}
                      >
                        <text
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: activeCitation === citId ? colors.accentFg : colors.accent,
                            fontFamily: FONT_SANS,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {`#${citId.replace('seg_', '')}`}
                        </text>
                      </div>
                    ))}
                  </div>

                  {/* Popover quote for citation */}
                  {bullet.citations?.includes(activeCitation ?? '') && (
                    <div
                      style={{
                        marginTop: 4,
                        padding: 8,
                        borderRadius: 6,
                        backgroundColor: colors.surface2,
                        borderLeftWidth: 2,
                        borderColor: colors.accent,
                      }}
                    >
                      <text style={{ fontSize: 11.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
                        {`Citation: "${liveSegments.find((s) => s.id === activeCitation)?.text ?? 'Referenced spoken audio'}"`}
                      </text>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
