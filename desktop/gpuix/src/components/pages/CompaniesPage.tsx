import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'

export function CompaniesPage() {
  const companies = useBagrryStore((s) => s.companies)
  const colors = useBagrryStore((s) => s.colors)
  const [hoverRow, setHoverRow] = useState<string | null>(null)

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
            <Icons.Building2 size={18} color={colors.text} />
            <text style={{ fontSize: 22, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Companies'}
            </text>
          </div>
          <text style={{ fontSize: 13, color: colors.textSubtle, fontFamily: FONT_SANS }}>
            {'Organizations and domains identified in your meeting transcripts.'}
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
          {companies.map((cmp, idx) => {
            const isHover = hoverRow === cmp.id
            return (
              <div
                key={cmp.id}
                onMouseEnter={() => setHoverRow(cmp.id)}
                onMouseLeave={() => setHoverRow(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderBottomWidth: idx === companies.length - 1 ? 0 : 1,
                  borderColor: colors.border,
                  backgroundColor: isHover ? colors.hover : 'transparent',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icons.Building2 size={14} color={colors.textMuted} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, gap: 1 }}>
                  <text style={{ fontSize: 13, fontWeight: '500', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {cmp.name}
                  </text>
                  <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {cmp.domain}
                  </text>
                </div>

                <div
                  style={{
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 2,
                    paddingBottom: 2,
                    borderRadius: 6,
                    backgroundColor: colors.surface2,
                  }}
                >
                  <text style={{ fontSize: 11, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {`${cmp.note_count} notes`}
                  </text>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
