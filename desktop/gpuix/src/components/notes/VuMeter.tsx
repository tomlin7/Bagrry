import React from 'react'
import { useBagrryStore } from '../../store/bagrry-store'

export function VuMeter() {
  const vu = useBagrryStore((s) => s.vu)
  const colors = useBagrryStore((s) => s.colors)

  const micWidth = Math.max(4, Math.round(vu.mic * 32))
  const sysWidth = Math.max(4, Math.round(vu.system * 32))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        paddingLeft: 6,
        paddingRight: 6,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: 6,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Mic channel */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <div
          style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.surface2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: micWidth,
              height: '100%',
              backgroundColor: colors.accent,
            }}
          />
        </div>
      </div>

      {/* System loopback channel */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <div
          style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.surface2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: sysWidth,
              height: '100%',
              backgroundColor: colors.success,
            }}
          />
        </div>
      </div>
    </div>
  )
}
