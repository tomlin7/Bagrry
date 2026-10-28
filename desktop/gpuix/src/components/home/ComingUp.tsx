import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return '12:00 PM'
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ComingUp() {
  const calendarEvents = useBagrryStore((s) => s.calendarEvents)
  const startRecording = useBagrryStore((s) => s.startRecording)
  const createMeeting = useBagrryStore((s) => s.createMeeting)
  const colors = useBagrryStore((s) => s.colors)
  const [hoverEvent, setHoverEvent] = useState<string | null>(null)

  const today = new Date()
  const dayNumber = today.getDate()
  const monthName = MONTHS[today.getMonth()]
  const weekdayName = WEEKDAYS[today.getDay()]

  const handleStartFromCalendar = (title: string) => {
    const note = createMeeting(title)
    startRecording(note.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 24 }}>
      <text
        style={{
          fontSize: 26,
          fontFamily: FONT_DISPLAY,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 12,
          whiteSpace: 'nowrap',
        }}
      >
        {'Coming up'}
      </text>

      {/* Coming up card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        }}
      >
        {/* Left Date column */}
        <div
          style={{
            width: 140,
            flexShrink: 0,
            borderRightWidth: 1,
            borderColor: colors.border,
            padding: 16,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <text
            style={{
              fontSize: 28,
              fontFamily: FONT_DISPLAY,
              fontWeight: '600',
              color: colors.text,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {`${dayNumber}`}
          </text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.text,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {monthName}
              </text>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 9999,
                  backgroundColor: colors.danger,
                }}
              />
            </div>
            <text
              style={{
                fontSize: 11,
                color: colors.textSubtle,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {weekdayName}
            </text>
          </div>
        </div>

        {/* Right Events list */}
        <div
          style={{
            flexGrow: 1,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {calendarEvents.slice(0, 3).map((ev) => {
            const isHover = hoverEvent === ev.id
            let attendees: string[] = []
            try {
              if (ev.attendees_json) attendees = JSON.parse(ev.attendees_json)
            } catch {}

            return (
              <div
                key={ev.id}
                onMouseEnter={() => setHoverEvent(ev.id)}
                onMouseLeave={() => setHoverEvent(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 8,
                  padding: 8,
                  backgroundColor: isHover ? colors.hover : 'transparent',
                }}
              >
                {/* Event Avatar */}
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: colors.hover,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      fontFamily: FONT_SANS,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ev.title.charAt(0)}
                  </text>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                  <text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: colors.text,
                      fontFamily: FONT_SANS,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ev.title}
                  </text>
                  <text
                    style={{
                      fontSize: 11.5,
                      color: colors.textSubtle,
                      fontFamily: FONT_SANS,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`${formatTime(ev.start_at)}${attendees.length > 0 ? ` · ${attendees.join(', ')}` : ''}`}
                  </text>
                </div>

                {/* Quick record button */}
                <div
                  testId={`record-event-${ev.id}`}
                  onClick={() => handleStartFromCalendar(ev.title)}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    paddingLeft: 8,
                    paddingRight: 10,
                    borderRadius: 6,
                    backgroundColor: isHover ? colors.solid : 'transparent',
                    borderWidth: isHover ? 0 : 1,
                    borderColor: colors.border,
                    cursor: 'pointer',
                  }}
                >
                  <Icons.Mic size={12} color={isHover ? colors.solidFg : colors.textMuted} />
                  <text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '600',
                      color: isHover ? colors.solidFg : colors.textMuted,
                      fontFamily: FONT_SANS,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {'Record'}
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
