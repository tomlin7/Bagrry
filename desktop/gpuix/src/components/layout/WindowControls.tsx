import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { toggleWindowZoom } from '../../window-drag'

interface WindowControlsProps {
  style?: any
}

const SVG_MIN = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><line x1="0" y1="5.5" x2="10" y2="5.5" /></svg>'
const SVG_RESTORE = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><rect x="0.5" y="2.5" width="7" height="7" /><path d="M2.5 2.5V0.5H9.5V7.5H7.5" /></svg>'
const SVG_MAX = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><rect x="0.5" y="0.5" width="9" height="9" /></svg>'
const SVG_CLOSE = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><line x1="0.5" y1="0.5" x2="9.5" y2="9.5" /><line x1="9.5" y1="0.5" x2="0.5" y2="9.5" /></svg>'

export function WindowControls({ style }: WindowControlsProps) {
  const colors = useBagrryStore((s) => s.colors)
  const [maximized, setMaximized] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const handleMinimize = () => {
    try {
      const { resolveWindowHandle } = require('../../window-drag')
      const lib = require('../../window-drag').loadUser32?.()
      const hwnd = resolveWindowHandle?.()
      if (lib && hwnd) {
        lib.symbols.ShowWindow(hwnd, 6 /* SW_MINIMIZE */)
      }
    } catch {}
  }

  const handleMaximize = () => {
    const next = !maximized
    setMaximized(next)
    toggleWindowZoom()
  }

  const handleClose = () => {
    try {
      if (typeof process !== 'undefined') {
        process.exit(0)
      }
    } catch {}
  }

  const minSource = SVG_MIN.replace('currentColor', hovered === 'min' ? colors.text : colors.textMuted)
  const maxSource = (maximized ? SVG_RESTORE : SVG_MAX).replace('currentColor', hovered === 'max' ? colors.text : colors.textMuted)
  const closeSource = SVG_CLOSE.replace('currentColor', hovered === 'close' ? '#ffffff' : colors.textMuted)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: 32,
        alignItems: 'stretch',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Minimize Button */}
      <div
        testId="window-minimize"
        onMouseEnter={() => setHovered('min')}
        onMouseLeave={() => setHovered(null)}
        onClick={handleMinimize}
        style={{
          width: 46,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: hovered === 'min' ? colors.hover : 'transparent',
        }}
      >
        <svg
          source={minSource}
          style={{ width: 10, height: 10, pointerEvents: 'none' }}
        />
      </div>

      {/* Maximize / Restore Button */}
      <div
        testId="window-maximize"
        onMouseEnter={() => setHovered('max')}
        onMouseLeave={() => setHovered(null)}
        onClick={handleMaximize}
        style={{
          width: 46,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: hovered === 'max' ? colors.hover : 'transparent',
        }}
      >
        <svg
          source={maxSource}
          style={{ width: 10, height: 10, pointerEvents: 'none' }}
        />
      </div>

      {/* Close Button */}
      <div
        testId="window-close"
        onMouseEnter={() => setHovered('close')}
        onMouseLeave={() => setHovered(null)}
        onClick={handleClose}
        style={{
          width: 46,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: hovered === 'close' ? '#c42b1c' : 'transparent',
        }}
      >
        <svg
          source={closeSource}
          style={{ width: 10, height: 10, pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}
