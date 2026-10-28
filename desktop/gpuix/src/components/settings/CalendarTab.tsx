import React from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_SANS } from '../../theme'
import {
  AccentLink,
  ActionButton,
  SettingRow,
  SettingsCard,
  Switch,
  TabHeading,
} from './shared'

export function CalendarTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const profile = useBagrryStore((s) => s.profile)
  const calendarEvents = useBagrryStore((s) => s.calendarEvents)
  const resetCalendar = useBagrryStore((s) => s.resetCalendar)
  const importCalendarEvents = useBagrryStore((s) => s.importCalendarEvents)
  const settings = useBagrryStore((s) => s.settings)
  const setSetting = useBagrryStore((s) => s.setSetting)

  const emptyEvents = settings['calendar_show_empty_events'] !== 'false'
  const primaryVisible = settings['calendar_primary_visible'] !== 'false'
  const email = profile.email || 'Local calendar'

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Calendar" />

      {/* Display */}
      <SettingsCard title="Display">
        <SettingRow
          icon={<Icons.Users size={15} color={colors.text} />}
          title="Show events with no participants"
          description="'Coming up' will include events without participants."
          control={
            <Switch
              testId="cal-empty-events-switch"
              checked={emptyEvents}
              onCheckedChange={(val) => {
                setSetting('calendar_show_empty_events', val ? 'true' : 'false')
                onNotice('Calendar display preference saved')
              }}
            />
          }
        />
      </SettingsCard>

      {/* Visible calendars */}
      <SettingsCard
        title="Visible calendars"
        action={
          <AccentLink
            testId="reset-calendar-btn"
            onClick={() => {
              resetCalendar()
              onNotice('Calendar cleared')
            }}
          >
            {'Reset'}
          </AccentLink>
        }
      >
        <SettingRow
          icon={
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                backgroundColor: '#7ab8ff',
              }}
            />
          }
          title={email}
          description={`${calendarEvents.length} event${calendarEvents.length === 1 ? '' : 's'} stored locally`}
          control={
            <Switch
              testId="cal-primary-switch"
              checked={primaryVisible}
              onCheckedChange={(val) => {
                setSetting('calendar_primary_visible', val ? 'true' : 'false')
                onNotice(val ? 'Primary calendar enabled' : 'Primary calendar hidden')
              }}
            />
          }
        />
      </SettingsCard>

      {/* Import */}
      <SettingsCard title="Import">
        <SettingRow
          icon={<Icons.CalendarClock size={15} color={colors.text} />}
          title="Import an .ics file"
          description="Export from Google Calendar or Outlook, then drop the file here."
          control={
            <ActionButton
              testId="import-ics-btn"
              onClick={() => {
                importCalendarEvents([
                  {
                    id: `cal_import_${Date.now()}`,
                    title: 'Quarterly OKR Planning & Retrospective',
                    start_at: new Date(Date.now() + 60 * 60_000).toISOString(),
                    end_at: new Date(Date.now() + 120 * 60_000).toISOString(),
                    attendees_json: JSON.stringify(['Elena Rostova', 'Sarah Chen']),
                  },
                ])
                onNotice('Imported 1 event from calendar.ics')
              }}
            >
              {'Choose file'}
            </ActionButton>
          }
        />
      </SettingsCard>

      <div style={{ paddingLeft: 4, paddingRight: 4, marginTop: 8 }}>
        <text style={{ fontSize: 12.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
          {'Google and Outlook OAuth is not wired yet — import an .ics export to populate Coming up.'}
        </text>
      </div>
    </div>
  )
}
