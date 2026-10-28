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
  const [workspaceDraft, setWorkspaceDraft] = useState(profile.workspace)
  const [apiKeyDraft, setApiKeyDraft] = useState('gsk_live_994827103947201948')
  const [webhookDraft, setWebhookDraft] = useState('https://api.bagrry.dev/v1/webhook')
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

            {/* Audio configuration */}
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
                  gap: 8,
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
                {'Bagrry can read ICS calendar feeds to notify you when calls start and auto-attach meeting attendees.'}
              </text>
              <div
                onClick={() => showSaved('Calendar feed re-synced')}
                style={{
                  alignSelf: 'flex-start',
                  paddingLeft: 12,
                  paddingRight: 12,
                  height: 28,
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
            <div style={{ padding: 14, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS }}>
                {'Meeting start reminders and recording notifications are enabled.'}
              </text>
            </div>
          </div>
        )}

        {/* HELP TAB */}
        {tab === 'help' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <text style={{ fontSize: 20, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Get Help'}
            </text>
            <div style={{ padding: 14, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS }}>
                {'Bagrry runs 100% on-device on GPU with GPUIX. Transcripts and scratchpads never leave your machine.'}
              </text>
              <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS }}>
                {'Version 0.22.0 · Native Win32 GPU Build'}
              </text>
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
