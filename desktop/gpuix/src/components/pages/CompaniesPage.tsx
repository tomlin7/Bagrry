import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'
import type { Company } from '../../types'

export function CompaniesPage() {
  const companies = useBagrryStore((s) => s.companies)
  const addCompany = useBagrryStore((s) => s.addCompany)
  const meetings = useBagrryStore((s) => s.meetings)
  const openNote = useBagrryStore((s) => s.openNote)
  const colors = useBagrryStore((s) => s.colors)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [hoverRow, setHoverRow] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDomain, setNewDomain] = useState('')

  const handleAddCompany = () => {
    if (!newName.trim()) return
    const cmp = addCompany(newName.trim(), newDomain.trim())
    setNewName('')
    setNewDomain('')
    setShowAddModal(false)
    setSelectedCompany(cmp)
  }

  const filtered = companies.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.domain && c.domain.toLowerCase().includes(q))
  })

  const companyMeetings = selectedCompany
    ? meetings.filter((m) =>
        m.scratchpad_raw.toLowerCase().includes(selectedCompany.name.toLowerCase()) ||
        m.title.toLowerCase().includes(selectedCompany.name.toLowerCase())
      )
    : []

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
        position: 'relative',
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
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, borderColor: colors.border }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 6,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
              cursor: 'pointer',
            }}
          >
            <Icons.Plus size={12} color={colors.text} />
            <text style={{ fontSize: 11.5, fontWeight: '500', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'Add company'}
            </text>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 36,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          <Icons.Search size={14} color={colors.textSubtle} />
          <input
            value={searchQuery}
            placeholder="Search organizations or domains..."
            style={{
              flexGrow: 1,
              fontSize: 13,
              color: colors.text,
              backgroundColor: '#00000000',
              borderWidth: 0,
              fontFamily: FONT_SANS,
            }}
            onChange={(e: any) => setSearchQuery(e.value ?? '')}
          />
          {searchQuery && (
            <div
              onClick={() => setSearchQuery('')}
              style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Icons.X size={12} color={colors.textSubtle} />
            </div>
          )}
        </div>

        {/* Companies list */}
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
          {filtered.length === 0 ? (
            <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <text style={{ fontSize: 13, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'No organizations found.'}
              </text>
            </div>
          ) : (
            filtered.map((cmp, idx) => {
              const isHover = hoverRow === cmp.id
              return (
                <div
                  key={cmp.id}
                  onClick={() => setSelectedCompany(cmp)}
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
                    borderBottomWidth: idx === filtered.length - 1 ? 0 : 1,
                    borderColor: colors.border,
                    backgroundColor: isHover ? colors.hover : 'transparent',
                    cursor: 'pointer',
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
                      {cmp.domain || 'No domain'}
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
            })
          )}
        </div>
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: '#00000088',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: 380,
              borderRadius: 14,
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <text style={{ fontSize: 15, fontWeight: '600', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Add Company'}
              </text>
              <div
                onClick={() => setShowAddModal(false)}
                style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icons.X size={14} color={colors.textSubtle} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <text style={{ fontSize: 11.5, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Company Name'}
              </text>
              <input
                value={newName}
                placeholder="e.g. Acme Corp"
                style={{
                  height: 34,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  paddingLeft: 10,
                  paddingRight: 10,
                  fontSize: 13,
                  color: colors.text,
                  fontFamily: FONT_SANS,
                }}
                onChange={(e: any) => setNewName(e.value ?? '')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <text style={{ fontSize: 11.5, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Domain'}
              </text>
              <input
                value={newDomain}
                placeholder="e.g. acme.com"
                style={{
                  height: 34,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  paddingLeft: 10,
                  paddingRight: 10,
                  fontSize: 13,
                  color: colors.text,
                  fontFamily: FONT_SANS,
                }}
                onChange={(e: any) => setNewDomain(e.value ?? '')}
                onSubmit={handleAddCompany}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <div
                onClick={() => setShowAddModal(false)}
                style={{
                  paddingLeft: 12,
                  paddingRight: 12,
                  height: 30,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Cancel'}
                </text>
              </div>
              <div
                onClick={handleAddCompany}
                style={{
                  paddingLeft: 14,
                  paddingRight: 14,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: colors.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <text style={{ fontSize: 12, fontWeight: '600', color: colors.accentFg, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Save Company'}
                </text>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company detail modal */}
      {selectedCompany && !showAddModal && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: '#00000088',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: 440,
              borderRadius: 14,
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icons.Building2 size={18} color={colors.accent} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <text style={{ fontSize: 15, fontWeight: '600', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {selectedCompany.name}
                  </text>
                  <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {selectedCompany.domain || 'No domain'}
                  </text>
                </div>
              </div>

              <div
                onClick={() => setSelectedCompany(null)}
                style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icons.X size={14} color={colors.textSubtle} />
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: colors.border }} />

            <text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'Associated Meetings'}
            </text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflow: 'hidden' }}>
              {companyMeetings.length > 0 ? (
                companyMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedCompany(null)
                      openNote(m.id)
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      padding: 8,
                      borderRadius: 6,
                      backgroundColor: colors.surface,
                      cursor: 'pointer',
                    }}
                  >
                    <Icons.NotebookPen size={12} color={colors.textMuted} />
                    <text style={{ fontSize: 12.5, color: colors.text, fontFamily: FONT_SANS, flexGrow: 1, whiteSpace: 'nowrap' }}>
                      {m.title}
                    </text>
                    <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {m.date.slice(0, 10)}
                    </text>
                  </div>
                ))
              ) : (
                <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'No direct mention in scratchpad text yet.'}
                </text>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
