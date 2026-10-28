/**
 * Bagrry — Meeting Notes & AI Chat Cockpit rendered on the GPU with GPUIX.
 * Ported 1:1 from desktop/tauri to native GPUIX desktop architecture.
 */

import React, { useEffect } from 'react'
import { render } from '@gpuix/react'
import { useBagrryStore } from './src/store/bagrry-store'
import { SidebarRail } from './src/components/layout/SidebarRail'
import { Sidebar } from './src/components/layout/Sidebar'
import { TitleBar } from './src/components/layout/TitleBar'
import { HomePage } from './src/components/pages/HomePage'
import { NotePage } from './src/components/pages/NotePage'
import { SpacePage } from './src/components/pages/SpacePage'
import { SharedPage } from './src/components/pages/SharedPage'
import { ChatPage } from './src/components/pages/ChatPage'
import { PeoplePage } from './src/components/pages/PeoplePage'
import { CompaniesPage } from './src/components/pages/CompaniesPage'
import { SettingsPage } from './src/components/pages/SettingsPage'
import { CommandPalette } from './src/components/CommandPalette'
import { Onboarding } from './src/components/Onboarding'
import { readWindowState, saveWindowState } from './src/shell/state'

export function BagrryApp(_props?: any) {
  const route = useBagrryStore((s) => s.route)
  const sidebarOpen = useBagrryStore((s) => s.sidebarOpen)
  const toggleSidebar = useBagrryStore((s) => s.toggleSidebar)
  const setPaletteOpen = useBagrryStore((s) => s.setPaletteOpen)
  const createMeeting = useBagrryStore((s) => s.createMeeting)
  const back = useBagrryStore((s) => s.back)
  const colors = useBagrryStore((s) => s.colors)

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      const isCtrl = e.ctrlKey || e.metaKey
      if (isCtrl && e.key?.toLowerCase() === 'k') {
        e.preventDefault?.()
        setPaletteOpen(true)
      } else if (isCtrl && e.key === '\\') {
        e.preventDefault?.()
        toggleSidebar()
      } else if (isCtrl && e.key?.toLowerCase() === 'n') {
        e.preventDefault?.()
        createMeeting()
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault?.()
        back()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setPaletteOpen, toggleSidebar, createMeeting, back])

  return (
    <div
      testId="bagrry-root"
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        color: colors.text,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Sliding Collapsible Sidebar Rail */}
      <SidebarRail open={sidebarOpen}>
        <Sidebar />
      </SidebarRail>

      {/* Main Content Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minWidth: 0,
          height: '100%',
          backgroundColor: colors.bg,
          overflow: 'hidden',
        }}
      >
        <TitleBar />

        <div
          testId="bagrry-main"
          style={{
            flexGrow: 1,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: colors.bg,
          }}
        >
          {route.kind === 'home' && <HomePage />}
          {route.kind === 'shared' && <SharedPage />}
          {route.kind === 'space' && <SpacePage spaceId={route.spaceId} />}
          {route.kind === 'note' && <NotePage noteId={route.noteId} />}
          {route.kind === 'chat' && <ChatPage sessionId={route.sessionId} />}
          {route.kind === 'people' && <PeoplePage />}
          {route.kind === 'companies' && <CompaniesPage />}
          {route.kind === 'settings' && <SettingsPage tab={route.tab} />}
        </div>
      </div>

      {/* Modals & Overlays */}
      <CommandPalette />
      <Onboarding />
    </div>
  )
}

export const HiroshiApp = BagrryApp
export const ChatApp = BagrryApp
export const ModelPicker = (_props?: any) => null
export default BagrryApp

const isEntryPoint =
  typeof Bun !== 'undefined'
    ? process.env.HIROSHI_WINDOW_CHILD === '1' || Bun.main === import.meta.path
    : typeof process !== 'undefined' &&
      (process.argv[1]?.endsWith('chat.tsx') || process.argv[1]?.endsWith('app.tsx'))

if (isEntryPoint) {
  let saved = { width: 1180, height: 820 }
  try {
    saved = readWindowState(process.cwd())
  } catch {}

  render(<BagrryApp />, {
    title: 'Bagrry',
    width: saved.width || 1180,
    height: saved.height || 820,
    titlebarTransparent: true,
    windowBackground: 'blurred',
    trafficLightX: 16,
    trafficLightY: 17,
    debugFrameOverlay: 'hidden',
    focus: process.env.GPUIX_BACKGROUND !== '1',
  })
}
