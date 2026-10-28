import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_MONO, FONT_SANS } from '../../theme'
import type { SettingsTab } from '../../types'

interface SettingsPageProps {
  tab: SettingsTab
}

export function SettingsPage({ tab }: SettingsPageProps) {
  const colors = useBagrryStore((s) => s.colors)
  const themePref = useBagrryStore((s) => s.themePreference)
  const setThemePreference = useBagrryStore((s) => s.setThemePreference)
  const profile = useBagrryStore((s) => s.profile)
  const settings = useBagrryStore((s) => s.settings)
  const setSetting = useBagrryStore((s) => s.setSetting)

  const [nameDraft, setNameDraft] = useState(profile.name)
  const [emailDraft, setEmailDraft] = useState(profile.email)
  const [workspaceDraft, setWorkspaceDraft] = useState(profile.workspace)
  const [apiKeyDraft, setApiKeyDraft] = useState('gsk_live_994827103947201948')
  const [webhookDraft, setWebhookDraft] = useState('https://api.bagrry.dev/v1/webhook')
  const [icsFeedDraft, setIcsFeedDraft] = useState('https://calendar.google.com/calendar/ical/alex%40bagrry.dev/private-abc/basic.ics')
  const [speakerTags, setSpeakerTags] = useState(true)
  const [autoEnhance, setAutoEnhance] = useState(true)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const showSaved = (msg = 'Changes saved') => {
    setSavedNotice(msg)
    setTimeout(() => setSavedNotice(null), 2000)
  }

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
      {savedNotice && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 24,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 8,
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.borderStrong,
          }}
        >
          <text style={{ fontSize: 12, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
            {savedNotice}
          </text>
        </div>
      )}

      <div
        style={{
          width: '100%',
          maxWidth: 640,
          paddingLeft: 24,
          paddingRight: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* PREFERENCES TAB */}
        {tab === 'preferences' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <text style={{ fontSize: 20, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Preferences'}
            </text>

            {/* Theme selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <text style={{ fontSize: 13, fontWeight: '500', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Appearance & Theme'}
              </text>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                {(['dark', 'light', 'system'] as const).map((pref) => (
                  <div
                    key={pref}
                    onClick={() => {
                      setThemePreference(pref)
                      showSaved(`Theme changed to ${pref}`)
                    }}
                    style={{
                      flexGrow: 1,
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: themePref === pref ? colors.accent : colors.border,
                      backgroundColor: themePref === pref ? colors.surface2 : colors.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <text
                      style={{
                        fontSize: 12.5,
                        fontWeight: themePref === pref ? '600' : '400',
                        color: themePref === pref ? colors.text : colors.textMuted,
                        fontFamily: FONT_SANS,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pref.charAt(0).toUpperCase() + pref.slice(1)}
                    </text>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio configuration & Transcription */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <text style={{ fontSize: 13, fontWeight: '500', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Audio & Transcription Engine'}
              </text>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {'Primary Microphone'}
                  </text>
                  <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {'Default System Device'}
                  </text>
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {'System Audio Loopback (WASAPI)'}
                  </text>
                  <div style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, borderRadius: 4, backgroundColor: colors.accentSubtle }}>
                    <text style={{ fontSize: 10.5, fontWeight: '600', color: colors.accent, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {'Active'}
                    </text>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {'Speaker Diarization Tags'}
                    </text>
                    <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {'Tag transcript segments by "Me" vs "Attendees"'}
                    </text>
                  </div>
                  <div
                    onClick={() => {
                      setSpeakerTags(!speakerTags)
                      showSaved(speakerTags ? 'Speaker tags disabled' : 'Speaker tags enabled')
                    }}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: speakerTags ? colors.accent : colors.surface2,
                      borderWidth: 1,
                      borderColor: speakerTags ? colors.accent : colors.borderStrong,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: speakerTags ? 'flex-end' : 'flex-start',
                      paddingLeft: 2,
                      paddingRight: 2,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: speakerTags ? colors.accentFg : colors.textSubtle }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {'Automatic AI Enhancement'}
                    </text>
                    <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {'Generate executive summary & action items upon recording stop'}
                    </text>
                  </div>
                  <div
                    onClick={() => {
                      setAutoEnhance(!autoEnhance)
                      showSaved(autoEnhance ? 'Auto-enhancement disabled' : 'Auto-enhancement enabled')
                    }}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: autoEnhance ? colors.accent : colors.surface2,
                      borderWidth: 1,
                      borderColor: autoEnhance ? colors.accent : colors.borderStrong,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: autoEnhance ? 'flex-end' : 'flex-start',
                      paddingLeft: 2,
                      paddingRight: 2,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: autoEnhance ? colors.accentFg : colors.textSubtle }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Reference */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <text style={{ fontSize: 13, fontWeight: '500', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Keyboard Shortcuts'}
              </text>
              <div
                style={{
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: 'hidden',
                }}
              >
                {[
                  { key: 'Ctrl + K', desc: 'Open Command Palette' },
                  { key: 'Ctrl + N', desc: 'Create new meeting note' },
                  { key: 'Ctrl + \\', desc: 'Toggle navigation sidebar' },
                  { key: 'Ctrl + Shift + R', desc: 'Start or pause recording' },
                  { key: 'Ctrl + Shift + S', desc: 'Stop recording & auto-enhance' },
                ].map((sc, i) => (
                  <div
                    key={sc.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderBottomWidth: i === 4 ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <text style={{ fontSize: 12.5, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {sc.desc}
                    </text>
                    <div style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, borderRadius: 4, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border }}>
                      <text style={{ fontSize: 11, fontFamily: FONT_MONO, color: colors.textMuted, whiteSpace: 'nowrap' }}>
                        {sc.key}
                      </text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <text style={{ fontSize: 20, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Profile & Identity'}
            </text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Your Name'}
              </text>
              <input
                value={nameDraft}
                style={{
                  height: 34,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                  paddingLeft: 10,
                  paddingRight: 10,
                  fontSize: 13,
                  color: colors.text,
                }}
                onChange={(e: any) => setNameDraft(e.value ?? '')}
                onSubmit={() => showSaved('Profile name updated')}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Email Address'}
              </text>
              <input
                value={emailDraft}
                style={{
                  height: 34,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                  paddingLeft: 10,
                  paddingRight: 10,
                  fontSize: 13,
                  color: colors.text,
                }}
                onChange={(e: any) => setEmailDraft(e.value ?? '')}
                onSubmit={() => showSaved('Email updated')}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Workspace'}
              </text>
              <input
                value={workspaceDraft}
                style={{
                  height: 34,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                  paddingLeft: 10,
                  paddingRight: 10,
                  fontSize: 13,
                  color: colors.text,
                }}
                onChange={(e: any) => setWorkspaceDraft(e.value ?? '')}
                onSubmit={() => showSaved('Workspace name updated')}
              />
            </div>
          </div>
        )}

        {/* CONNECTORS TAB */}
        {tab === 'connectors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <text style={{ fontSize: 20, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Connectors & API Keys'}
            </text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Groq Whisper & Llama API Key'}
              </text>
              <input
                value={apiKeyDraft}
                style={{
                  height: 34,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                  paddingLeft: 10,
                  paddingRight: 10,
                  fontSize: 13,
                  fontFamily: FONT_MONO,
                  color: colors.text,
                }}
                onChange={(e: any) => setApiKeyDraft(e.value ?? '')}
                onSubmit={() => showSaved('API key updated')}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {'Outgoing Webhook URL'}
              </text>
              <input
                value={webhookDraft}
                style={{
                  height: 34,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                  paddingLeft: 10,
                  paddingRight: 10,
                  fontSize: 13,
                  fontFamily: FONT_MONO,
                  color: colors.text,
                }}
                onChange={(e: any) => setWebhookDraft(e.value ?? '')}
                onSubmit={() => showSaved('Webhook URL updated')}
              />
            </div>
          </div>
        )}

        {/* CALENDAR TAB */}
        {tab === 'calendar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <text style={{ fontSize: 20, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Calendar Sync'}
            </text>
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS }}>
                {'Bagrry reads ICS calendar feeds to notify you when calls start and auto-attach meeting attendees.'}
              </text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'ICS Subscription URL'}
                </text>
                <input
                  value={icsFeedDraft}
                  style={{
                    height: 34,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    backgroundColor: colors.surface2,
                    paddingLeft: 10,
                    paddingRight: 10,
                    fontSize: 12,
                    fontFamily: FONT_MONO,
                    color: colors.text,
                  }}
                  onChange={(e: any) => setIcsFeedDraft(e.value ?? '')}
                />
              </div>

              <div
                onClick={() => showSaved('Calendar feed synchronized (2 upcoming events)')}
                style={{
                  alignSelf: 'flex-start',
                  paddingLeft: 14,
                  paddingRight: 14,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: colors.solid,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <text style={{ fontSize: 12, fontWeight: '600', color: colors.solidFg, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Sync Now'}
                </text>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <text style={{ fontSize: 20, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Notifications'}
            </text>
            <div style={{ padding: 14, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS }}>
                {'Meeting start reminders and recording notifications are enabled.'}
              </text>
              <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS }}>
                {'Windows system notifications will alert you 2 minutes before any scheduled calendar call.'}
              </text>
            </div>
          </div>
        )}

        {/* HELP TAB */}
        {tab === 'help' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <text style={{ fontSize: 20, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'System Diagnostics & Help'}
            </text>
            <div style={{ padding: 14, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Rendering Engine'}
                </text>
                <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                  {'GPUIX (DirectX 12 / Vulkan Native)'}
                </text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Window Management'}
                </text>
                <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                  {'Win32 FFI Modal Loop (user32.dll)'}
                </text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Audio Capture'}
                </text>
                <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                  {'WASAPI Loopback + DirectSound'}
                </text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Storage'}
                </text>
                <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                  {'100% On-Device SQLite'}
                </text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'App Version'}
                </text>
                <text style={{ fontSize: 12, color: colors.accent, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                  {'v0.22.0'}
                </text>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE GENERAL / MEMBERS / SPACES / ANALYTICS / BILLING / REFERRALS */}
        {['workspace-general', 'members', 'spaces', 'analytics', 'billing', 'referrals'].includes(tab) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <text style={{ fontSize: 20, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </text>
            <div style={{ padding: 14, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS }}>
                {`Configuration options for ${tab.replace('-', ' ')}.`}
              </text>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
