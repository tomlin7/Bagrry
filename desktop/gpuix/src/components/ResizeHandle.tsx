import React, { useState } from 'react'
import { useBagrryStore } from '../store/bagrry-store'

interface ResizeHandleProps {
  testId?: string
  side: 'left' | 'right'
  isResizing: boolean
  onMouseDown: (e: any) => void
}

export function ResizeHandle({
  testId = 'resize-handle',
  side,
  isResizing,
  onMouseDown,
}: ResizeHandleProps) {
  const colors = useBagrryStore((s) => s.colors)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      testId={testId}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side === 'left' ? 'right' : 'left']: 0,
        width: 6,
        cursor: 'col-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: 2,
          height: '100%',
          backgroundColor: isResizing || hovered ? colors.accent : 'transparent',
          opacity: isResizing || hovered ? 1 : 0,
        }}
      />
    </div>
  )
}
