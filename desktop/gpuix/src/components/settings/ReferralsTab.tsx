import React from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_MONO, FONT_SANS } from '../../theme'
import {
  ActionButton,
  Badge,
  SettingsCard,
  TabHeading,
} from './shared'

const STEPS = [
  { n: '1', title: 'Share your link', body: 'Send it to teammates who take meeting notes.' },
  { n: '2', title: 'They join Bagrry', body: 'When they create a workspace from your link, it counts.' },
  { n: '3', title: 'You both get credit', body: 'Rewards land here once cloud billing is live.' },
]

export function ReferralsTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const profile = useBagrryStore((s) => s.profile)

  const code = (profile.name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10) + '982'
  const referralUrl = `https://bagrry.app/r/${code}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Referrals" />

      {/* Code card */}
      <SettingsCard>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ alignSelf: 'flex-start' }}>
            <Badge tone="accent">Your code</Badge>
          </div>
          <text
            style={{
              fontSize: 22,
              fontFamily: FONT_DISPLAY,
              fontWeight: '700',
              color: colors.text,
              whiteSpace: 'nowrap',
            }}
          >
            {'Invite people to Bagrry'}
          </text>
          <text
            style={{
              fontSize: 13,
              color: colors.textMuted,
              fontFamily: FONT_SANS,
              lineHeight: 1.4,
              maxWidth: 480,
            }}
          >
            {'This is your personal referral code, stored on this device. Copy the link and send it.'}
          </text>

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div
              style={{
                flexGrow: 1,
                paddingLeft: 12,
                paddingRight: 12,
                height: 34,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surface2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <text style={{ fontSize: 12, fontFamily: FONT_MONO, color: colors.textMuted, whiteSpace: 'nowrap' }}>
                {referralUrl}
              </text>
            </div>
            <ActionButton
              testId="copy-referral-btn"
              variant="accent"
              onClick={() => onNotice('Referral link copied to clipboard')}
            >
              <Icons.Copy size={13} color={colors.accentFg} />
              {'Copy'}
            </ActionButton>
          </div>
        </div>
      </SettingsCard>

      {/* 3 Step cards */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        {STEPS.map((step) => (
          <div
            key={step.n}
            style={{
              flexGrow: 1,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {step.n}
              </text>
            </div>
            <text style={{ fontSize: 13, fontWeight: '600', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {step.title}
            </text>
            <text style={{ fontSize: 12, color: colors.textSubtle, fontFamily: FONT_SANS, lineHeight: 1.35 }}>
              {step.body}
            </text>
          </div>
        ))}
      </div>

      {/* Rules card */}
      <SettingsCard title="A few rules">
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
            <text style={{ fontSize: 12.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
              {'Self-referrals do not count.'}
            </text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
            <text style={{ fontSize: 12.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
              {'The code is unique to this install.'}
            </text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />
            <text style={{ fontSize: 12.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
              {'Cloud rewards ship with billing.'}
            </text>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}
