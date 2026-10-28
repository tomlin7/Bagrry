import React from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_MONO, FONT_SANS } from '../../theme'
import {
  ActionButton,
  OptionPillGroup,
  SettingRow,
  SettingsCard,
  Switch,
  TabHeading,
} from './shared'

export function PreferencesTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const themePreference = useBagrryStore((s) => s.themePreference)
  const setThemePreference = useBagrryStore((s) => s.setThemePreference)
  const settings = useBagrryStore((s) => s.settings)
  const setSetting = useBagrryStore((s) => s.setSetting)

  const liveIndicator = settings['live_indicator'] !== 'false'
  const autostart = settings['autostart'] === 'true'
  const reposition = settings['reposition_for_meetings'] !== 'false'
  const speakerTags = settings['speaker_tags'] !== 'false'
  const followUpEmails = settings['suggested_follow_up_emails'] === 'true'
  const improveModels = settings['improve_models'] !== 'false'
  const linkSharing = settings['default_link_sharing'] || 'link'
  const retention = settings['transcript_retention'] || 'off'
  const chatModel = settings['chat_model'] || 'llama-3.3-70b-versatile'
  const sttModel = settings['stt_model'] || 'whisper-large-v3-turbo'
  const transcriptionLang = settings['transcription_language'] || 'en-best'
  const summaryLang = settings['summary_language'] || 'en'
  const jargon = settings['internal_jargon'] || ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Preferences" />

      {/* General */}
      <SettingsCard title="General">
        <SettingRow
          icon={<Icons.Radio size={15} color={colors.text} />}
          title="Live meeting indicator"
          description="Shows on the right of your screen while transcribing."
          control={
            <Switch
              testId="pref-indicator-switch"
              checked={liveIndicator}
              onCheckedChange={(val) => {
                setSetting('live_indicator', val ? 'true' : 'false')
                onNotice(val ? 'Live meeting indicator on' : 'Live meeting indicator off')
              }}
            />
          }
        />
        <SettingRow
          icon={<Icons.LogIn size={15} color={colors.text} />}
          title="Open Bagrry when you log in"
          description="Bagrry will start automatically with your computer."
          control={
            <Switch
              testId="pref-autostart-switch"
              checked={autostart}
              onCheckedChange={(val) => {
                setSetting('autostart', val ? 'true' : 'false')
                onNotice(val ? 'Bagrry will open at login' : 'Login launch turned off')
              }}
            />
          }
        />
        <SettingRow
          icon={<Icons.Eye size={15} color={colors.text} />}
          title="Reposition Bagrry for meetings"
          description="Bagrry will move aside during a meeting, then restore afterwards."
          control={
            <Switch
              testId="pref-reposition-switch"
              checked={reposition}
              onCheckedChange={(val) => {
                setSetting('reposition_for_meetings', val ? 'true' : 'false')
                onNotice('Meeting reposition setting updated')
              }}
            />
          }
        />
      </SettingsCard>

      {/* Features */}
      <SettingsCard title="Features">
        <SettingRow
          icon={<Icons.Tags size={15} color={colors.text} />}
          title="Speaker tags"
          description="Label who is speaking (you vs attendees) in the transcript."
          control={
            <Switch
              testId="pref-speaker-tags-switch"
              checked={speakerTags}
              onCheckedChange={(val) => {
                setSetting('speaker_tags', val ? 'true' : 'false')
                onNotice(val ? 'Speaker tags enabled' : 'Speaker tags disabled')
              }}
            />
          }
        />
        <SettingRow
          icon={<Icons.Mail size={15} color={colors.text} />}
          title="Suggested follow-up emails"
          description="After enhancing a meeting, offer a draft recap email you can copy."
          control={
            <Switch
              testId="pref-followup-switch"
              checked={followUpEmails}
              onCheckedChange={(val) => {
                setSetting('suggested_follow_up_emails', val ? 'true' : 'false')
                onNotice('Follow-up email setting updated')
              }}
            />
          }
        />
      </SettingsCard>

      {/* AI Models */}
      <SettingsCard title="AI models">
        <SettingRow
          icon={<Icons.Cpu size={15} color={colors.text} />}
          title="Chat model"
          description="Used for Ask, enhance, recipes, briefs, and live copilot."
          control={
            <OptionPillGroup
              value={chatModel}
              onChange={(val) => {
                setSetting('chat_model', val)
                onNotice(`Chat model set to ${val}`)
              }}
              options={[
                { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
                { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
                { value: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
              ]}
            />
          }
        />
        <SettingRow
          icon={<Icons.Mic size={15} color={colors.text} />}
          title="Transcription model"
          description="Whisper variant Groq uses when turning meeting audio into text."
          control={
            <OptionPillGroup
              value={sttModel}
              onChange={(val) => {
                setSetting('stt_model', val)
                onNotice(`Transcription model set to ${val}`)
              }}
              options={[
                { value: 'whisper-large-v3-turbo', label: 'Whisper Turbo' },
                { value: 'whisper-large-v3', label: 'Whisper Large v3' },
              ]}
            />
          }
        />
      </SettingsCard>

      {/* Appearance */}
      <SettingsCard title="Appearance">
        <SettingRow
          icon={<Icons.Moon size={15} color={colors.text} />}
          title="Theme"
          description="Choose your interface colour scheme."
          control={
            <OptionPillGroup
              value={themePreference}
              onChange={(val) => {
                setThemePreference(val as any)
                onNotice(`Theme changed to ${val}`)
              }}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'system', label: 'System' },
              ]}
            />
          }
        />
      </SettingsCard>

      {/* Data & sharing */}
      <SettingsCard title="Data & sharing">
        <SettingRow
          icon={<Icons.Link2 size={15} color={colors.text} />}
          title="Default link sharing"
          description="Used when you share a note. Private links never serve content."
          control={
            <OptionPillGroup
              value={linkSharing}
              onChange={(val) => {
                setSetting('default_link_sharing', val)
                onNotice(`Link sharing set to ${val}`)
              }}
              options={[
                { value: 'private', label: 'Only me' },
                { value: 'workspace', label: 'Workspace' },
                { value: 'link', label: 'Anyone with link' },
              ]}
            />
          }
        />
        <SettingRow
          icon={<Icons.ShieldCheck size={15} color={colors.text} />}
          title="Use my data to improve models for everyone"
          description="When on, your name, role and company description are included in AI prompts."
          control={
            <Switch
              testId="pref-improve-models-switch"
              checked={improveModels}
              onCheckedChange={(val) => {
                setSetting('improve_models', val ? 'true' : 'false')
                onNotice('Data sharing preference saved')
              }}
            />
          }
        />
        <SettingRow
          icon={<Icons.Trash2 size={15} color={colors.text} />}
          title="Auto deletion period for transcripts"
          description="Transcripts older than this are deleted on launch."
          control={
            <OptionPillGroup
              value={retention}
              onChange={(val) => {
                setSetting('transcript_retention', val)
                onNotice(`Retention set to ${val}`)
              }}
              options={[
                { value: 'off', label: 'Off' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
                { value: '365', label: '1 year' },
              ]}
            />
          }
        />
      </SettingsCard>

      {/* Language */}
      <SettingsCard title="Language" dashed>
        <SettingRow
          title="Transcription language"
          description="Passed to Whisper when turning audio into text."
          control={
            <OptionPillGroup
              value={transcriptionLang}
              onChange={(val) => {
                setSetting('transcription_language', val)
                onNotice(`Transcription language: ${val}`)
              }}
              options={[
                { value: 'en-best', label: 'English (Best)' },
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'auto', label: 'Auto' },
              ]}
            />
          }
        />
        <SettingRow
          title="Summary language"
          description="Language for enhanced notes and chat."
          control={
            <OptionPillGroup
              value={summaryLang}
              onChange={(val) => {
                setSetting('summary_language', val)
                onNotice(`Summary language: ${val}`)
              }}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'match', label: 'Match' },
              ]}
            />
          }
        />
      </SettingsCard>

      {/* Internal Jargon */}
      <SettingsCard title="Internal jargon">
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS }}>
            {'Words and acronyms Whisper should recognise, and that summaries should keep as-is.'}
          </text>
          <input
            testId="pref-jargon-input"
            value={jargon}
            placeholder="OKRs, ARR, Northwind, GPUIX, FFI…"
            onChange={(e: any) => setSetting('internal_jargon', e.value ?? '')}
            style={{
              height: 36,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: 'transparent',
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: 13,
              color: colors.text,
              fontFamily: FONT_SANS,
            }}
          />
        </div>
      </SettingsCard>
    </div>
  )
}
