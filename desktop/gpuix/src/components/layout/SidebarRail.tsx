import React from 'react'
import { motion } from '@gpuix/react'
import { SIDEBAR_WIDTH } from '../../theme'

interface SidebarRailProps {
  open: boolean
  children: React.ReactNode
}

export function SidebarRail({ open, children }: SidebarRailProps) {
  return (
    <motion.div
      initial={false}
      animate={{ width: open ? SIDEBAR_WIDTH : 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ width: SIDEBAR_WIDTH, height: '100%', overflow: 'hidden' }}>
        {children}
      </div>
    </motion.div>
  )
}
