import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { FONT_DISPLAY, FONT_MONO, FONT_SANS } from '../../theme'
import { ActionButton, QuietInput, SettingRow, SettingsCard, SettingsField, TabHeading } from './shared'

export function ProfileTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const profile = useBagrryStore((s) => s.profile)
  const setProfile = useBagrryStore((s) => s.setProfile)
  const settings = useBagrryStore((s) => s.settings)
  const setSetting = useBagrryStore((s) => s.setSetting)
  const deleteAllData = useBagrryStore((s) => s.deleteAllData)

  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [workspace, setWorkspace] = useState(profile.workspace)
  const [jobTitle, setJobTitle] = useState(settings['profile_job_title'] || 'Engineering Lead')
  const [linkedin, setLinkedin] = useState(settings['profile_linkedin'] || 'alexrivera')
  const [companyDesc, setCompanyDesc] = useState(
    settings['profile_company_description'] || 'High-performance native desktop AI interfaces',
  )
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const handleSaveProfile = () => {
    setProfile(name, email, workspace)
    setSetting('profile_job_title', jobTitle)
    setSetting('profile_linkedin', linkedin)
    setSetting('profile_company_description', companyDesc)
    onNotice('Profile saved')
  }

  const initials = (name || 'You')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading
        title="Profile"
        description="Bagrry works best knowing a little about you. This is used when summarising your meetings."
      />

      {/* Account */}
      <SettingsCard title="Account" dashed>
        <SettingRow
          icon={
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.accentFg,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {initials}
              </text>
            </div>
          }
          title={name || 'Your name'}
          description={email || 'No email set'}
          control={
            <ActionButton variant="solid" onClick={handleSaveProfile} testId="save-profile-btn">
              {'Save'}
            </ActionButton>
          }
        />

        <SettingsField label="Full name">
          <QuietInput
            testId="profile-name-input"
            value={name}
            onChange={(val) => {
              setName(val)
              setProfile(val, email, workspace)
            }}
            placeholder="Your name"
          />
        </SettingsField>

        <SettingsField label="Email">
          <QuietInput
            testId="profile-email-input"
            value={email}
            onChange={(val) => {
              setEmail(val)
              setProfile(name, val, workspace)
            }}
            placeholder="you@company.com"
          />
        </SettingsField>

        <SettingsField label="Job title">
          <QuietInput
            testId="profile-jobtitle-input"
            value={jobTitle}
            onChange={(val) => {
              setJobTitle(val)
              setSetting('profile_job_title', val)
            }}
            placeholder="Investing Partner / Lead Engineer"
          />
        </SettingsField>

        <SettingsField label="LinkedIn username">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              height: 32,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              paddingLeft: 10,
              paddingRight: 10,
            }}
          >
            <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'linkedin.com/in/'}
            </text>
            <input
              testId="profile-linkedin-input"
              value={linkedin}
              onChange={(e: any) => {
                const val = (e.value ?? '').replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
                setLinkedin(val)
                setSetting('profile_linkedin', val)
              }}
              placeholder="alexrivera"
              style={{
                flexGrow: 1,
                backgroundColor: 'transparent',
                borderWidth: 0,
                fontSize: 13,
                color: colors.text,
                paddingLeft: 4,
              }}
            />
          </div>
        </SettingsField>
      </SettingsCard>

      {/* Your company */}
      <SettingsCard title="Your company" dashed>
        <SettingsField label="Company name">
          <QuietInput
            testId="profile-company-input"
            value={workspace}
            onChange={(val) => {
              setWorkspace(val)
              setProfile(name, email, val)
            }}
            placeholder="Acme Corp"
          />
        </SettingsField>

        <SettingsField
          label="Company description"
          hint="Bagrry takes this into account when summarising your meetings."
        >
          <input
            testId="profile-desc-input"
            value={companyDesc}
            onChange={(e: any) => {
              setCompanyDesc(e.value ?? '')
              setSetting('profile_company_description', e.value ?? '')
            }}
            placeholder="What does your company do?"
            style={{
              height: 48,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: 'transparent',
              paddingLeft: 10,
              paddingRight: 10,
              fontSize: 13,
              color: colors.text,
              fontFamily: FONT_SANS,
            }}
          />
        </SettingsField>
      </SettingsCard>

      {/* Account management */}
      <SettingsCard title="Account management" dashed>
        <SettingRow
          title="Import notes from another account"
          description="Choose Markdown or text files. Each file becomes a note."
          control={
            <ActionButton
              testId="import-notes-btn"
              onClick={() => onNotice('Importing Markdown / TXT files…')}
            >
              {'Import'}
            </ActionButton>
          }
        />
        <SettingRow
          title="Export historical data"
          description="Download a CSV of your notes and attendees to your Downloads folder."
          control={
            <ActionButton
              testId="export-csv-btn"
              onClick={() => onNotice('CSV exported to Downloads/bagrry-notes.csv')}
            >
              {'Generate CSV'}
            </ActionButton>
          }
        />
      </SettingsCard>

      {/* Danger zone */}
      <SettingsCard title="Danger zone" danger dashed>
        <SettingRow
          title="Delete my account"
          description="Deletes every note, transcript, chat and calendar event on this computer. Type DELETE to confirm."
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 16,
          }}
        >
          <QuietInput
            testId="delete-confirm-input"
            value={deleteConfirm}
            onChange={setDeleteConfirm}
            placeholder="DELETE"
            style={{ width: 140 }}
          />
          <ActionButton
            testId="delete-account-btn"
            danger
            disabled={deleteConfirm !== 'DELETE'}
            onClick={() => {
              deleteAllData()
              setDeleteConfirm('')
              onNotice('All notes and local data deleted')
            }}
          >
            {'Delete my account'}
          </ActionButton>
        </div>
      </SettingsCard>
    </div>
  )
}
