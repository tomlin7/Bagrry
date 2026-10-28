import React from 'react'
import { motion } from '@gpuix/react'
import { ResizeHandle } from '../ResizeHandle'

interface SidebarRailProps {
  open: boolean
  width: number
  isResizing: boolean
  onStartResize: (e: any) => void
  children: React.ReactNode
}

export function SidebarRail({
  open,
  width,
  isResizing,
  onStartResize,
  children,
}: SidebarRailProps) {
  return (
    <motion.div
      initial={false}
      animate={{ width: open ? width : 0 }}
      transition={{ duration: isResizing ? 0 : 0.2, ease: 'easeOut' }}
      style={{
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ width, height: '100%', overflow: 'hidden' }}>
        {children}
      </div>
      {open && (
        <ResizeHandle
          testId="resize-handle-left"
          side="left"
          isResizing={isResizing}
          onMouseDown={onStartResize}
        />
      )}
    </motion.div>
  )
}
