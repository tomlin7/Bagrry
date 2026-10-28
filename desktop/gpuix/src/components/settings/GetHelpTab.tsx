import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_MONO, FONT_SANS } from '../../theme'
import {
  ActionButton,
  Badge,
  OptionPillGroup,
  SettingRow,
  SettingsCard,
  TabHeading,
} from './shared'

const BUG_TEMPLATE = `What happened?

What did you expect?

Steps to reproduce:
1.
2.
3.`

const FEATURE_TEMPLATE = `What should we add?

Why would it help?`

export function GetHelpTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const submitFeedback = useBagrryStore((s) => s.submitFeedback)

  const [feedbackKind, setFeedbackKind] = useState<'problem' | 'feature'>('problem')
  const [feedbackBody, setFeedbackBody] = useState(BUG_TEMPLATE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Get help" />

      {/* Help links */}
      <SettingsCard>
        <SettingRow
          icon={<Icons.BookOpen size={15} color={colors.text} />}
          title="Help Center"
          description="Documentation, tutorials, and getting started guides."
          control={<Icons.ChevronRight size={14} color={colors.textSubtle} />}
          onClick={() => onNotice('Opening Help Center in default browser…')}
        />
        <SettingRow
          icon={<Icons.CircleHelp size={15} color={colors.text} />}
          title="Troubleshooting"
          description="Common issues, WASAPI loopback audio setup, and FAQs."
          control={<Icons.ChevronRight size={14} color={colors.textSubtle} />}
          onClick={() => onNotice('Opening Troubleshooting guide…')}
        />
      </SettingsCard>

      {/* Send feedback */}
      <SettingsCard title="Send feedback">
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OptionPillGroup
            value={feedbackKind}
            onChange={(val) => {
              setFeedbackKind(val)
              setFeedbackBody(val === 'problem' ? BUG_TEMPLATE : FEATURE_TEMPLATE)
            }}
            options={[
              { value: 'problem', label: 'Problem' },
              { value: 'feature', label: 'Feature request' },
            ]}
          />

          <input
            testId="feedback-body-input"
            value={feedbackBody}
            onChange={(e: any) => setFeedbackBody(e.value ?? '')}
            style={{
              height: 110,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: colors.surface2,
              padding: 12,
              fontSize: 12.5,
              color: colors.text,
              fontFamily: FONT_SANS,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ActionButton
              testId="submit-feedback-btn"
              variant="accent"
              onClick={() => {
                submitFeedback(feedbackKind, feedbackBody)
                onNotice(feedbackKind === 'problem' ? 'Bug report submitted locally' : 'Feature request sent')
                setFeedbackBody(feedbackKind === 'problem' ? BUG_TEMPLATE : FEATURE_TEMPLATE)
              }}
            >
              {feedbackKind === 'problem' ? 'Report bug' : 'Send request'}
            </ActionButton>
          </div>
        </div>
      </SettingsCard>

      {/* Community */}
      <SettingsCard>
        <SettingRow
          icon={<Icons.Hash size={15} color={colors.text} />}
          title="Join the Bagrry community"
          description="Ask questions and share tips with other users."
          control={<Icons.ArrowUpRight size={14} color={colors.textSubtle} />}
          onClick={() => onNotice('Opening GitHub community discussions…')}
        />
      </SettingsCard>

      {/* Keyboard Shortcuts */}
      <SettingsCard title="Keyboard shortcuts">
        <SettingRow title="Command palette" control={<Badge>Ctrl K</Badge>} />
        <SettingRow title="Toggle sidebar" control={<Badge>Ctrl \</Badge>} />
        <SettingRow title="Settings" control={<Badge>Ctrl ,</Badge>} />
        <SettingRow title="Start / stop recording" control={<Badge>Ctrl Shift R</Badge>} />
        <SettingRow title="Pause recording" control={<Badge>Ctrl Shift P</Badge>} />
        <SettingRow title="Back" control={<Badge>Alt ←</Badge>} />
      </SettingsCard>

      {/* Diagnostics */}
      <SettingsCard title="Diagnostics">
        <SettingRow title="Database" description="C:/Users/BIT/AppData/Roaming/bagrry/bagrry.sqlite" />
        <SettingRow title="Vector search" description="Hash embeddings (sqlite-vec enabled)" />
        <SettingRow title="Local API" description="127.0.0.1:48201" />
        <SettingRow title="DirectX / Vulkan GPU Renderer" description="Active (GPUIX Windows native)" />
      </SettingsCard>
    </div>
  )
}
