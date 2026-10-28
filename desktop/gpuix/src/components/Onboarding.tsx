import React, { useState } from 'react'
import { useBagrryStore } from '../store/bagrry-store'
import { Icons } from './icons'
import { FONT_DISPLAY, FONT_SANS } from '../theme'

export function Onboarding() {
  const open = useBagrryStore((s) => s.onboardingOpen)
  const finishOnboarding = useBagrryStore((s) => s.finishOnboarding)
  const colors = useBagrryStore((s) => s.colors)

  const [step, setStep] = useState(0)

  if (!open) return null

  const steps = [
    {
      icon: Icons.Mic,
      title: 'Capture every meeting',
      description:
        'Bagrry records your microphone and system audio with zero cloud dependency. Transcripts are generated locally on your device with complete privacy.',
    },
    {
      icon: Icons.Sparkles,
      title: 'Notes that write themselves',
      description:
        'Jot down rough bullet points while you chat. When the call wraps up, Bagrry merges them into structured summaries with citations back to what was said.',
    },
  ]

  const isLast = step >= steps.length

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#00000088',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 16,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {!isLast ? (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.accentSubtle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.createElement(steps[step].icon, { size: 18, color: colors.accent })}
            </div>

            <text
              style={{
                fontSize: 18,
                fontFamily: FONT_DISPLAY,
                fontWeight: '600',
                color: colors.text,
                whiteSpace: 'nowrap',
              }}
            >
              {steps[step].title}
            </text>

            <text style={{ fontSize: 13, lineHeight: 1.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
              {steps[step].description}
            </text>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <div
                onClick={() => setStep(step + 1)}
                style={{
                  height: 32,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 8,
                  backgroundColor: colors.solid,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <text style={{ fontSize: 12.5, fontWeight: '600', color: colors.solidFg, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Next'}
                </text>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.accentSubtle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icons.KeyRound size={18} color={colors.accent} />
            </div>

            <text style={{ fontSize: 18, fontFamily: FONT_DISPLAY, fontWeight: '600', color: colors.text, whiteSpace: 'nowrap' }}>
              {'Ready to go'}
            </text>

            <text style={{ fontSize: 13, lineHeight: 1.5, color: colors.textMuted, fontFamily: FONT_SANS }}>
              {'You can configure your local audio devices and Groq transcription key anytime in Settings.'}
            </text>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <div
                onClick={finishOnboarding}
                style={{
                  height: 32,
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 8,
                  backgroundColor: colors.solid,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <text style={{ fontSize: 12.5, fontWeight: '600', color: colors.solidFg, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Get Started'}
                </text>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
