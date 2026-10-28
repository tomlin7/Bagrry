import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_MONO, FONT_SANS } from '../../theme'
import {
  ActionButton,
  Badge,
  QuietInput,
  SettingRow,
  SettingsCard,
  Switch,
  TabHeading,
} from './shared'

const INTEGRATIONS = [
  { id: 'gmail', name: 'Gmail', hint: 'Follow-up emails via webhook', color: '#ea4335', placeholder: 'https://hooks.zapier.com/…' },
  { id: 'slack', name: 'Slack', hint: 'Incoming webhook to a channel', color: '#4a154b', placeholder: 'https://hooks.slack.com/services/…' },
  { id: 'notion', name: 'Notion', hint: 'Export via Zapier / Make', color: '#37352f', placeholder: 'https://hooks.zapier.com/…' },
  { id: 'zapier', name: 'Zapier', hint: 'Catch-hook for any Zap', color: '#ff4a00', placeholder: 'https://hooks.zapier.com/…' },
  { id: 'affinity', name: 'Affinity', hint: 'CRM via Zapier', color: '#1f6feb', placeholder: 'https://hooks.zapier.com/…' },
  { id: 'hubspot', name: 'HubSpot', hint: 'CRM via Zapier', color: '#ff7a59', placeholder: 'https://hooks.zapier.com/…' },
  { id: 'salesforce', name: 'Salesforce', hint: 'CRM via Zapier', color: '#00a1e0', placeholder: 'https://hooks.zapier.com/…' },
  { id: 'attio', name: 'Attio', hint: 'CRM via Zapier', color: '#1d1d1b', placeholder: 'https://hooks.zapier.com/…' },
  { id: 'pipedrive', name: 'Pipedrive', hint: 'CRM via Zapier', color: '#017737', placeholder: 'https://hooks.zapier.com/…' },
]

export function ConnectorsTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const apiKeys = useBagrryStore((s) => s.apiKeys)
  const createApiKey = useBagrryStore((s) => s.createApiKey)
  const revokeApiKey = useBagrryStore((s) => s.revokeApiKey)
  const meetings = useBagrryStore((s) => s.meetings)
  const settings = useBagrryStore((s) => s.settings)
  const setSetting = useBagrryStore((s) => s.setSetting)

  const [openIntegration, setOpenIntegration] = useState<string | null>(null)
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const [groqKeyInput, setGroqKeyInput] = useState(settings['groq_api_key'] || 'gsk_live_demo848201948')
  const [webhookUrl, setWebhookUrl] = useState(settings['webhook_url'] || 'https://api.bagrry.dev/v1/webhook')

  const groqConfigured = !!groqKeyInput.trim()

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Connectors" />

      {/* Integrations */}
      <SettingsCard
        title="Integrations"
        description="Paste a webhook URL to send completed notes to each tool. Native OAuth lands later."
      >
        {INTEGRATIONS.map((item) => {
          const isOpen = openIntegration === item.id
          const itemUrl = settings[`connector_${item.id}_url`] || ''
          const isEnabled = settings[`connector_${item.id}`] === '1'
          const isConnected = isEnabled && itemUrl.trim().length > 0

          return (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', borderBottomWidth: 1, borderColor: colors.border }}>
              <div
                testId={`connector-row-${item.id}`}
                onClick={() => setOpenIntegration(isOpen ? null : item.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff', fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {item.name.slice(0, 1)}
                    </text>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <text style={{ fontSize: 13, fontWeight: '500', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                      {item.name}
                    </text>
                    <text style={{ fontSize: 11.5, color: colors.textSubtle, fontFamily: FONT_SANS }}>
                      {item.hint}
                    </text>
                  </div>
                </div>
                <div>
                  {isConnected ? <Badge tone="success">On</Badge> : <Icons.ChevronRight size={14} color={colors.textSubtle} />}
                </div>
              </div>

              {isOpen && (
                <div
                  style={{
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingBottom: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    backgroundColor: colors.surface2,
                  }}
                >
                  <QuietInput
                    testId={`connector-input-${item.id}`}
                    value={itemUrl}
                    onChange={(val) => setSetting(`connector_${item.id}_url`, val)}
                    placeholder={item.placeholder}
                    fontMono
                  />
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <text style={{ fontSize: 11.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
                      {'Send notes here after enhance / share'}
                    </text>
                    <Switch
                      testId={`connector-switch-${item.id}`}
                      checked={isEnabled}
                      onCheckedChange={(val) => {
                        setSetting(`connector_${item.id}`, val ? '1' : '0')
                        onNotice(val ? `${item.name} connected` : `${item.name} disconnected`)
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </SettingsCard>

      {/* API */}
      <SettingsCard
        title="API"
        description="Keys authenticate the local HTTP API (127.0.0.1). Once any key exists, requests need Bearer auth."
      >
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
          <QuietInput
            testId="api-key-label-input"
            value={newKeyLabel}
            onChange={setNewKeyLabel}
            placeholder="Key label (e.g. CI / Local CLI)"
            style={{ flexGrow: 1 }}
          />
          <ActionButton
            testId="create-personal-key-btn"
            variant="accent"
            onClick={() => {
              const token = createApiKey(newKeyLabel || 'Personal key', 'personal')
              setRevealedToken(token)
              setNewKeyLabel('')
              onNotice('Personal key created — copy token now')
            }}
          >
            {'Create personal'}
          </ActionButton>
          <ActionButton
            testId="create-workspace-key-btn"
            onClick={() => {
              const token = createApiKey(newKeyLabel || 'Workspace key', 'workspace')
              setRevealedToken(token)
              setNewKeyLabel('')
              onNotice('Workspace key created')
            }}
          >
            {'Create workspace'}
          </ActionButton>
        </div>

        {revealedToken && (
          <div style={{ padding: 16, backgroundColor: colors.accentSubtle, display: 'flex', flexDirection: 'column', gap: 6, borderBottomWidth: 1, borderColor: colors.border }}>
            <text style={{ fontSize: 11.5, color: colors.accent, fontWeight: '600', fontFamily: FONT_SANS }}>
              {'Copy now — this is the only time the full token is shown:'}
            </text>
            <div style={{ padding: 8, borderRadius: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <text style={{ fontSize: 12, fontFamily: FONT_MONO, color: colors.text }}>
                {revealedToken}
              </text>
            </div>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <div style={{ padding: 16 }}>
            <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS }}>
              {'No keys yet. The local API is open on loopback.'}
            </text>
          </div>
        ) : (
          apiKeys.map((k) => (
            <SettingRow
              key={k.id}
              testId={`api-key-row-${k.id}`}
              icon={<Icons.KeyRound size={15} color={colors.text} />}
              title={k.label}
              description={`${k.kind} · …${k.token.slice(-6)} · ${k.created_at.slice(0, 10)}`}
              control={
                <ActionButton
                  testId={`revoke-key-${k.id}`}
                  variant="ghost"
                  danger
                  onClick={() => {
                    revokeApiKey(k.id)
                    onNotice('Key revoked')
                  }}
                >
                  {'Revoke'}
                </ActionButton>
              }
            />
          ))
        )}
      </SettingsCard>

      {/* This device */}
      <SettingsCard title="This device" description="Transcription and local storage for this computer.">
        <SettingRow
          icon={<Icons.KeyRound size={15} color={colors.text} />}
          title="Groq API key"
          description={groqConfigured ? 'A key is configured for speech-to-text.' : 'No key set — AI enhancement disabled.'}
          control={groqConfigured ? <Badge tone="success">Connected</Badge> : <Badge>Not set</Badge>}
        />
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
          <QuietInput
            testId="groq-key-input"
            value={groqKeyInput}
            onChange={setGroqKeyInput}
            placeholder="gsk_..."
            fontMono
            style={{ flexGrow: 1 }}
          />
          <ActionButton
            testId="save-groq-key-btn"
            variant="solid"
            onClick={() => {
              setSetting('groq_api_key', groqKeyInput.trim())
              onNotice('Groq API key saved')
            }}
          >
            {'Save'}
          </ActionButton>
        </div>

        <SettingRow
          icon={<Icons.Webhook size={15} color={colors.text} />}
          title="Outgoing webhook URL"
          description="Bagrry posts completed notes here when you choose Send to webhook."
        />
        <div style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
          <QuietInput
            testId="outgoing-webhook-input"
            value={webhookUrl}
            onChange={(val) => {
              setWebhookUrl(val)
              setSetting('webhook_url', val)
            }}
            placeholder="https://hooks.example.com/bagrry"
            fontMono
          />
        </div>

        <SettingRow
          icon={<Icons.Database size={15} color={colors.text} />}
          title="SQLite file"
          description="C:/Users/BIT/AppData/Roaming/bagrry/bagrry.sqlite"
        />
        <SettingRow
          icon={<Icons.Database size={15} color={colors.text} />}
          title="Notes stored"
          description={`${meetings.length} notes · SQLite 3.45.1`}
        />
        <SettingRow
          icon={<Icons.Link2 size={15} color={colors.text} />}
          title="Local API port"
          description="Share links and integrations are served on port 48201."
        />
      </SettingsCard>
    </div>
  )
}
