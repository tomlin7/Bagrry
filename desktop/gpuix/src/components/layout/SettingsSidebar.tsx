import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_SANS, SIDEBAR_WIDTH } from '../../theme'
import type { SettingsTab } from '../../types'
import { handleTitlebarMouseDown, updateWindowDrag, endWindowDrag } from '../../window-drag'

interface SettingsSidebarProps {
  tab: SettingsTab
  width?: number
}

interface NavItem {
  tab: SettingsTab
  label: string
  icon: any
}

const PERSONAL_NAV: NavItem[] = [
  { tab: 'preferences', label: 'Preferences', icon: Icons.Sliders },
  { tab: 'profile', label: 'Profile', icon: Icons.User },
  { tab: 'calendar', label: 'Calendar', icon: Icons.CalendarDays },
  { tab: 'notifications', label: 'Notifications', icon: Icons.Bell },
  { tab: 'connectors', label: 'Connectors', icon: Icons.Webhook },
  { tab: 'help', label: 'Get help', icon: Icons.CircleHelp },
]

const WORKSPACE_NAV: NavItem[] = [
  { tab: 'workspace-general', label: 'General', icon: Icons.Building2 },
  { tab: 'members', label: 'Members', icon: Icons.Users },
  { tab: 'spaces', label: 'Spaces & templates', icon: Icons.LayoutTemplate },
  { tab: 'analytics', label: 'Analytics', icon: Icons.BarChart3 },
  { tab: 'billing', label: 'Billing', icon: Icons.CreditCard },
  { tab: 'referrals', label: 'Referrals', icon: Icons.Gift },
]

export function SettingsSidebar({ tab, width = SIDEBAR_WIDTH }: SettingsSidebarProps) {
  const profile = useBagrryStore((s) => s.profile)
  const navigate = useBagrryStore((s) => s.navigate)
  const back = useBagrryStore((s) => s.back)
  const colors = useBagrryStore((s) => s.colors)
  const [hoverItem, setHoverItem] = useState<string | null>(null)

  const go = (targetTab: SettingsTab) => {
    navigate({ kind: 'settings', tab: targetTab }, { replace: true })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        height: '100%',
        backgroundColor: colors.sidebar,
        borderRightWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Profile header / drag handle */}
      <div
        testId="titlebar-drag-settings-sidebar"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          borderBottomWidth: 1,
          borderColor: colors.border,
          pointerEvents: 'auto',
        }}
        onMouseDown={(e: any) => handleTitlebarMouseDown(undefined, e)}
        onMouseMove={() => updateWindowDrag()}
        onMouseUp={() => endWindowDrag()}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.accentFg,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {profile.name.charAt(0)}
          </text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
          <text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.text,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {profile.name}
          </text>
          <text
            style={{
              fontSize: 11,
              color: colors.textSubtle,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {profile.email}
          </text>
        </div>
      </div>

      {/* Nav items list */}
      <div
        style={{
          flexGrow: 1,
          overflow: 'hidden',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {PERSONAL_NAV.map((entry) => {
          const Icon = entry.icon
          const isActive = tab === entry.tab
          const isHovered = hoverItem === entry.tab
          return (
            <div
              key={entry.tab}
              testId={`settings-nav-${entry.tab}`}
              onClick={() => go(entry.tab)}
              onMouseEnter={() => setHoverItem(entry.tab)}
              onMouseLeave={() => setHoverItem(null)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 32,
                borderRadius: 8,
                paddingLeft: 8,
                paddingRight: 8,
                cursor: 'pointer',
                backgroundColor: isActive
                  ? colors.selected
                  : isHovered
                    ? colors.hover
                    : 'transparent',
              }}
            >
              <Icon size={14} color={isActive ? colors.text : colors.textMuted} />
              <text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? '500' : '400',
                  color: isActive ? colors.text : colors.textMuted,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.label}
              </text>
            </div>
          )
        })}

        <div style={{ paddingLeft: 8, paddingTop: 14, paddingBottom: 4 }}>
          <text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: colors.textSubtle,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Workspace'}
          </text>
        </div>

        {WORKSPACE_NAV.map((entry) => {
          const Icon = entry.icon
          const isActive = tab === entry.tab
          const isHovered = hoverItem === entry.tab
          return (
            <div
              key={entry.tab}
              testId={`settings-nav-${entry.tab}`}
              onClick={() => go(entry.tab)}
              onMouseEnter={() => setHoverItem(entry.tab)}
              onMouseLeave={() => setHoverItem(null)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 32,
                borderRadius: 8,
                paddingLeft: 8,
                paddingRight: 8,
                cursor: 'pointer',
                backgroundColor: isActive
                  ? colors.selected
                  : isHovered
                    ? colors.hover
                    : 'transparent',
              }}
            >
              <Icon size={14} color={isActive ? colors.text : colors.textMuted} />
              <text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? '500' : '400',
                  color: isActive ? colors.text : colors.textMuted,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                  flexGrow: 1,
                }}
              >
                {entry.label}
              </text>
              {entry.tab === 'referrals' && (
                <div
                  style={{
                    paddingLeft: 6,
                    paddingRight: 6,
                    paddingTop: 1,
                    paddingBottom: 1,
                    borderRadius: 9999,
                    backgroundColor: colors.accentSubtle,
                  }}
                >
                  <text style={{ fontSize: 10, fontWeight: '600', color: colors.accent, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {'New'}
                  </text>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Sign out button */}
      <div style={{ padding: 8, borderTopWidth: 1, borderColor: colors.border }}>
        <div
          onClick={back}
          onMouseEnter={() => setHoverItem('sign_out')}
          onMouseLeave={() => setHoverItem(null)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 32,
            borderRadius: 8,
            paddingLeft: 8,
            paddingRight: 8,
            cursor: 'pointer',
            backgroundColor: hoverItem === 'sign_out' ? colors.hover : 'transparent',
          }}
        >
          <Icons.LogOut size={14} color={colors.danger} />
          <text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.danger,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Sign out'}
          </text>
        </div>
      </div>
    </div>
  )
}
