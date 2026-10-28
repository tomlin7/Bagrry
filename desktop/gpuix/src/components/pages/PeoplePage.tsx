import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'
import type { Person } from '../../types'

export function PeoplePage() {
  const people = useBagrryStore((s) => s.people)
  const addPerson = useBagrryStore((s) => s.addPerson)
  const meetings = useBagrryStore((s) => s.meetings)
  const openNote = useBagrryStore((s) => s.openNote)
  const colors = useBagrryStore((s) => s.colors)

  const [scope, setScope] = useState<'everyone' | 'met'>('everyone')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [hoverRow, setHoverRow] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const handleAddPerson = () => {
    if (!newName.trim()) return
    const p = addPerson(newName.trim(), newEmail.trim())
    setNewName('')
    setNewEmail('')
    setShowAddModal(false)
    setSelectedPerson(p)
  }

  const baseList = scope === 'met' ? people.filter((p) => p.note_count > 0 && !p.is_me) : people
  const filtered = baseList.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.email && p.email.toLowerCase().includes(q))
  })

  const personMeetings = selectedPerson
    ? meetings.filter((m) =>
        m.scratchpad_raw.toLowerCase().includes(selectedPerson.name.toLowerCase()) ||
        m.title.toLowerCase().includes(selectedPerson.name.toLowerCase())
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
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <text style={{ fontSize: 22, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
            {'People'}
          </text>

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Filter pills */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                padding: 2,
              }}
            >
              <div
                onClick={() => setScope('everyone')}
                style={{
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 3,
                  paddingBottom: 3,
                  borderRadius: 6,
                  backgroundColor: scope === 'everyone' ? colors.hover : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <text
                  style={{
                    fontSize: 11.5,
                    fontWeight: scope === 'everyone' ? '600' : '400',
                    color: scope === 'everyone' ? colors.text : colors.textMuted,
                    fontFamily: FONT_SANS,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {'Everyone'}
                </text>
              </div>
              <div
                onClick={() => setScope('met')}
                style={{
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 3,
                  paddingBottom: 3,
                  borderRadius: 6,
                  backgroundColor: scope === 'met' ? colors.hover : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <text
                  style={{
                    fontSize: 11.5,
                    fontWeight: scope === 'met' ? '600' : '400',
                    color: scope === 'met' ? colors.text : colors.textMuted,
                    fontFamily: FONT_SANS,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {'People I met'}
                </text>
              </div>
            </div>

            {/* Add person button */}
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
                {'Add person'}
              </text>
            </div>
          </div>
        </div>

        {/* Live Search Bar */}
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
            placeholder="Search by name or email..."
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

        {/* Directory table */}
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
                {'No contacts found matching search.'}
              </text>
            </div>
          ) : (
            filtered.map((person, idx) => {
              const isHover = hoverRow === person.id
              return (
                <div
                  key={person.id}
                  onClick={() => setSelectedPerson(person)}
                  onMouseEnter={() => setHoverRow(person.id)}
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
                      backgroundColor: person.is_me ? colors.accent : colors.surface2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: person.is_me ? colors.accentFg : colors.text,
                        fontFamily: FONT_SANS,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {person.name.charAt(0)}
                    </text>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, gap: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <text
                        style={{
                          fontSize: 13,
                          fontWeight: '500',
                          color: colors.text,
                          fontFamily: FONT_SANS,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {person.name}
                      </text>
                      {person.is_me && (
                        <div
                          style={{
                            paddingLeft: 4,
                            paddingRight: 4,
                            paddingTop: 1,
                            paddingBottom: 1,
                            borderRadius: 4,
                            backgroundColor: colors.accentSubtle,
                          }}
                        >
                          <text style={{ fontSize: 9.5, fontWeight: '600', color: colors.accent, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                            {'me'}
                          </text>
                        </div>
                      )}
                    </div>
                    <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {person.email || 'No email registered'}
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
                      {`${person.note_count} notes`}
                    </text>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Person Modal */}
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
                {'Add Contact'}
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
                {'Full Name'}
              </text>
              <input
                value={newName}
                placeholder="e.g. Jordan Miller"
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
                {'Email Address'}
              </text>
              <input
                value={newEmail}
                placeholder="e.g. jordan@example.com"
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
                onChange={(e: any) => setNewEmail(e.value ?? '')}
                onSubmit={handleAddPerson}
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
                onClick={handleAddPerson}
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
                  {'Save Contact'}
                </text>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Person detail modal */}
      {selectedPerson && !showAddModal && (
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
                    backgroundColor: colors.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <text style={{ fontSize: 16, fontWeight: '700', color: colors.accentFg, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {selectedPerson.name.charAt(0)}
                  </text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <text style={{ fontSize: 15, fontWeight: '600', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {selectedPerson.name}
                  </text>
                  <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {selectedPerson.email || 'No email'}
                  </text>
                </div>
              </div>

              <div
                onClick={() => setSelectedPerson(null)}
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
              {personMeetings.length > 0 ? (
                personMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedPerson(null)
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
