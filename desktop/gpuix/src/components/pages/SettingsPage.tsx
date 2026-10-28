import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { FONT_SANS } from '../../theme'
import type { SettingsTab } from '../../types'
import { PreferencesTab } from '../settings/PreferencesTab'
import { ProfileTab } from '../settings/ProfileTab'
import { CalendarTab } from '../settings/CalendarTab'
import { NotificationsTab } from '../settings/NotificationsTab'
import { ConnectorsTab } from '../settings/ConnectorsTab'
import { GetHelpTab } from '../settings/GetHelpTab'
import {
  AnalyticsTab,
  MembersTab,
  SpacesTab,
  WorkspaceGeneralTab,
} from '../settings/WorkspaceTabs'
import { BillingTab } from '../settings/BillingTab'
import { ReferralsTab } from '../settings/ReferralsTab'

interface SettingsPageProps {
  tab: SettingsTab
}

export function SettingsPage({ tab }: SettingsPageProps) {
  const colors = useBagrryStore((s) => s.colors)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const showSaved = (msg: string) => {
    setSavedNotice(msg)
    setTimeout(() => setSavedNotice(null), 2400)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        overflowY: 'scroll',
        paddingTop: 24,
        paddingBottom: 64,
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {savedNotice && (
        <div
          testId="settings-toast-notice"
          style={{
            position: 'absolute',
            top: 16,
            right: 28,
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 8,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
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
        }}
      >
        {tab === 'preferences' && <PreferencesTab onNotice={showSaved} />}
        {tab === 'profile' && <ProfileTab onNotice={showSaved} />}
        {tab === 'calendar' && <CalendarTab onNotice={showSaved} />}
        {tab === 'notifications' && <NotificationsTab onNotice={showSaved} />}
        {tab === 'connectors' && <ConnectorsTab onNotice={showSaved} />}
        {tab === 'help' && <GetHelpTab onNotice={showSaved} />}
        {tab === 'workspace-general' && <WorkspaceGeneralTab onNotice={showSaved} />}
        {tab === 'members' && <MembersTab onNotice={showSaved} />}
        {tab === 'spaces' && <SpacesTab onNotice={showSaved} />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'billing' && <BillingTab onNotice={showSaved} />}
        {tab === 'referrals' && <ReferralsTab onNotice={showSaved} />}
      </div>
    </div>
  )
}
