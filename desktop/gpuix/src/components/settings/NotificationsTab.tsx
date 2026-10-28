import React from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { FONT_SANS } from '../../theme'
import {
  AccentLink,
  OptionPillGroup,
  QuietInput,
  SettingRow,
  SettingsCard,
  Switch,
  TabHeading,
} from './shared'

const CHANNELS = [
  { value: 'feed-email', label: 'Feed & Email' },
  { value: 'feed', label: 'Activity Feed' },
  { value: 'email', label: 'Email' },
  { value: 'off', label: 'Off' },
]

export function NotificationsTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const settings = useBagrryStore((s) => s.settings)
  const setSetting = useBagrryStore((s) => s.setSetting)

  const scheduled = settings['notify_meeting_start'] !== 'false'
  const autoDetected = settings['notify_auto_detected'] !== 'false'
  const notesReady = settings['notify_notes_ready'] !== 'false'
  const quietApps = settings['notify_quiet_apps'] || 'Zoom, Microsoft Teams'
  const addedToFolder = settings['notify_added_to_folder'] || 'feed-email'
  const noteAdded = settings['notify_note_added_to_folder'] || 'off'
  const noteShared = settings['notify_note_shared'] || 'feed-email'
  const marketing = settings['notify_marketing'] === 'true'

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Notifications" />

      {/* Meeting notifications */}
      <SettingsCard title="Meeting notifications">
        <SettingRow
          title="Scheduled meetings"
          description="Show notifications 1 minute before meetings start."
          control={
            <Switch
              testId="notify-scheduled-switch"
              checked={scheduled}
              onCheckedChange={(val) => {
                setSetting('notify_meeting_start', val ? 'true' : 'false')
                onNotice('Meeting start notifications updated')
              }}
            />
          }
        />
        <SettingRow
          title="Auto-detected meetings"
          description="Notify when Bagrry hears a call on this computer."
          control={
            <Switch
              testId="notify-autodetect-switch"
              checked={autoDetected}
              onCheckedChange={(val) => {
                setSetting('notify_auto_detected', val ? 'true' : 'false')
                onNotice('Auto-detection notifications updated')
              }}
            />
          }
        />
        <SettingRow
          title="Notes ready"
          description="Desktop notification when a transcript or enhancement finishes."
          control={
            <Switch
              testId="notify-notesready-switch"
              checked={notesReady}
              onCheckedChange={(val) => {
                setSetting('notify_notes_ready', val ? 'true' : 'false')
                onNotice('Notes ready notification updated')
              }}
            />
          }
        />
        {autoDetected && (
          <div
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface2,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS }}>
                {"Don't notify me when a call is detected in these apps:"}
              </text>
              <QuietInput
                testId="notify-quiet-apps-input"
                value={quietApps}
                onChange={(val) => setSetting('notify_quiet_apps', val)}
                placeholder="Zoom, Slack, Teams…"
              />
            </div>
          </div>
        )}
      </SettingsCard>

      {/* Sharing notifications */}
      <SettingsCard
        title="Sharing notifications"
        dashed
        action={
          <AccentLink
            testId="reset-notifications-btn"
            onClick={() => {
              setSetting('notify_added_to_folder', 'feed-email')
              setSetting('notify_note_added_to_folder', 'off')
              setSetting('notify_note_shared', 'feed-email')
              onNotice('Sharing notifications reset to default')
            }}
          >
            {'Reset to default'}
          </AccentLink>
        }
      >
        <SettingRow
          title="Added to folder"
          description="When someone adds you to a folder."
          control={
            <OptionPillGroup
              value={addedToFolder}
              onChange={(val) => {
                setSetting('notify_added_to_folder', val)
                onNotice(`Folder notifications: ${val}`)
              }}
              options={CHANNELS}
            />
          }
        />
        <SettingRow
          title="Note added to folder"
          description="When a note is added to a folder you can see."
          control={
            <OptionPillGroup
              value={noteAdded}
              onChange={(val) => {
                setSetting('notify_note_added_to_folder', val)
                onNotice(`Note added notification: ${val}`)
              }}
              options={CHANNELS}
            />
          }
        />
        <SettingRow
          title="Note shared with you"
          description="When someone shares a note directly with you."
          control={
            <OptionPillGroup
              value={noteShared}
              onChange={(val) => {
                setSetting('notify_note_shared', val)
                onNotice(`Share notifications: ${val}`)
              }}
              options={CHANNELS}
            />
          }
        />
      </SettingsCard>

      {/* Marketing emails */}
      <SettingsCard title="Marketing emails">
        <SettingRow
          title="Product updates and tips"
          description="Receive product updates and tips to get more out of Bagrry."
          control={
            <Switch
              testId="notify-marketing-switch"
              checked={marketing}
              onCheckedChange={(val) => {
                setSetting('notify_marketing', val ? 'true' : 'false')
                onNotice(val ? 'Marketing updates subscribed' : 'Marketing updates unsubscribed')
              }}
            />
          }
        />
      </SettingsCard>
    </div>
  )
}
