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

const PLANS = [
  {
    id: 'basic' as const,
    name: 'Basic',
    price: '$8',
    period: 'per user / month',
    features: ['Local notes & transcripts', 'Calendar meeting sync', 'Custom prompt templates'],
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: '$14',
    period: 'per user / month',
    features: ['Everything in Basic', 'Real-time team sharing', '9 Webhook connectors', 'Priority model latency'],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 'Custom',
    period: 'annual billing',
    features: ['Everything in Business', 'SSO & Okta SAML', 'Admin audit logs', 'Dedicated GPU cluster'],
  },
]

export function BillingTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const billingPlan = useBagrryStore((s) => s.billingPlan)
  const setBillingPlan = useBagrryStore((s) => s.setBillingPlan)

  const current = PLANS.find((p) => p.id === billingPlan) ?? PLANS[1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Billing" />

      {/* Current plan card */}
      <SettingsCard>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: 20,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <text style={{ fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {current.name}
              </text>
              <Badge tone="accent">Local Plan</Badge>
            </div>
            <text style={{ fontSize: 13, color: colors.textMuted, fontFamily: FONT_SANS, lineHeight: 1.4 }}>
              {'Plans are configured locally on this device. Switching a plan activates matching workspace capabilities.'}
            </text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <text style={{ fontSize: 24, fontWeight: '700', fontFamily: FONT_DISPLAY, color: colors.text, whiteSpace: 'nowrap' }}>
              {current.price}
            </text>
            <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {current.period}
            </text>
          </div>
        </div>

        {/* 3 stats */}
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          {[
            { label: 'Seats', val: '1 user' },
            { label: 'Plan', val: current.name },
            { label: 'Workspace', val: 'This device' },
          ].map((item, idx) => (
            <div
              key={item.label}
              style={{
                flexGrow: 1,
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 12,
                paddingBottom: 12,
                borderLeftWidth: idx === 0 ? 0 : 1,
                borderColor: colors.border,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {item.label}
              </text>
              <text style={{ fontSize: 13, fontWeight: '600', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {item.val}
              </text>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Compare plans */}
      <div style={{ marginBottom: 8, paddingLeft: 2 }}>
        <text style={{ fontSize: 13, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
          {'Compare plans'}
        </text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        {PLANS.map((item) => {
          const isCurrent = item.id === billingPlan

          return (
            <div
              key={item.id}
              style={{
                flexGrow: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isCurrent ? colors.accent : colors.border,
                backgroundColor: colors.surface,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {item.name}
                </text>
                <text style={{ fontSize: 22, fontWeight: '700', fontFamily: FONT_DISPLAY, color: colors.text, whiteSpace: 'nowrap' }}>
                  {item.price}
                </text>
                <text style={{ fontSize: 11, color: colors.textSubtle, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {item.period}
                </text>
              </div>

              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1 }}>
                {item.features.map((f) => (
                  <div key={f} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icons.Check size={13} color={colors.accent} />
                    <text style={{ fontSize: 11.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
                      {f}
                    </text>
                  </div>
                ))}
              </div>

              <div style={{ padding: 16 }}>
                <ActionButton
                  testId={`switch-plan-${item.id}`}
                  variant={isCurrent ? 'solid' : 'outline'}
                  style={{ width: '100%' }}
                  onClick={() => {
                    setBillingPlan(item.id)
                    onNotice(`${item.name} plan activated`)
                  }}
                >
                  {isCurrent ? 'Current' : 'Switch'}
                </ActionButton>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
