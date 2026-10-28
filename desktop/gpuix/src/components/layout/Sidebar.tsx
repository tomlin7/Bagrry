import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_MONO, FONT_SANS, SIDEBAR_WIDTH } from '../../theme'
import { SettingsSidebar } from './SettingsSidebar'
import { handleTitlebarMouseDown, updateWindowDrag, endWindowDrag } from '../../window-drag'
import { MY_NOTES_SPACE, TEAM_SPACE } from '../../types'

interface SidebarProps {
  width?: number
}

export function Sidebar({ width = SIDEBAR_WIDTH }: SidebarProps) {
  const route = useBagrryStore((s) => s.route)

  if (route.kind === 'settings') {
    return <SettingsSidebar tab={route.tab} width={width} />
  }

  return <AppSidebar width={width} />
}

function AppSidebar({ width = SIDEBAR_WIDTH }: SidebarProps) {
  const route = useBagrryStore((s) => s.route)
  const navigate = useBagrryStore((s) => s.navigate)
  const openSettings = useBagrryStore((s) => s.openSettings)
  const setPaletteOpen = useBagrryStore((s) => s.setPaletteOpen)
  const profile = useBagrryStore((s) => s.profile)
  const folders = useBagrryStore((s) => s.folders)
  const chatSessions = useBagrryStore((s) => s.chatSessions)
  const createFolder = useBagrryStore((s) => s.createFolder)
  const createChatSession = useBagrryStore((s) => s.createChatSession)
  const colors = useBagrryStore((s) => s.colors)

  const [chatExpanded, setChatExpanded] = useState(true)
  const [hoverBtn, setHoverBtn] = useState<string | null>(null)
  const [showFolderModal, setShowFolderModal] = useState<null | { shared: boolean }>(null)
  const [folderDraft, setFolderDraft] = useState('')

  const workspaceName = profile.workspace || 'My workspace'
  const teamLabel = `${workspaceName} team`

  const privateFolders = folders.filter((f) => !f.is_shared)
  const sharedFolders = folders.filter((f) => f.is_shared)

  const handleCreateFolder = () => {
    if (!folderDraft.trim() || !showFolderModal) return
    createFolder(folderDraft.trim(), showFolderModal.shared)
    setFolderDraft('')
    setShowFolderModal(null)
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
      {/* Brand row / drag handle */}
      <div
        testId="titlebar-drag-sidebar"
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: 44,
          alignItems: 'center',
          paddingLeft: 12,
          paddingRight: 12,
          gap: 8,
          pointerEvents: 'auto',
        }}
        onMouseDown={(e: any) => handleTitlebarMouseDown(undefined, e)}
        onMouseMove={() => updateWindowDrag()}
        onMouseUp={() => endWindowDrag()}
      >
        <div
          testId="brand-home"
          onClick={() => navigate({ kind: 'home' })}
          onMouseEnter={() => setHoverBtn('brand')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: hoverBtn === 'brand' ? colors.hover : 'transparent',
          }}
        >
          <text
            style={{
              fontSize: 12,
              fontFamily: FONT_DISPLAY,
              fontWeight: '700',
              color: colors.text,
              whiteSpace: 'nowrap',
            }}
          >
            {'B'}
          </text>
        </div>
      </div>

      {/* Main navigation list */}
      <div
        style={{
          flexGrow: 1,
          overflow: 'hidden',
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 8,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search button (Ctrl+K) */}
        <div
          testId="sidebar-search-button"
          onClick={() => setPaletteOpen(true)}
          onMouseEnter={() => setHoverBtn('search')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 32,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: hoverBtn === 'search' ? colors.borderStrong : colors.border,
            backgroundColor: colors.surface,
            paddingLeft: 8,
            paddingRight: 8,
            marginBottom: 6,
            cursor: 'pointer',
          }}
        >
          <Icons.Search size={14} color={colors.textMuted} />
          <text
            style={{
              fontSize: 12.5,
              color: colors.textMuted,
              fontFamily: FONT_SANS,
              flexGrow: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {'Search'}
          </text>
          <div
            style={{
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 1,
              paddingBottom: 1,
              borderRadius: 4,
              backgroundColor: colors.hover,
            }}
          >
            <text
              style={{
                fontSize: 10,
                fontFamily: FONT_MONO,
                color: colors.textSubtle,
                whiteSpace: 'nowrap',
              }}
            >
              {'Ctrl+K'}
            </text>
          </div>
        </div>

        {/* Primary nav: Home */}
        <div
          testId="nav-home"
          onClick={() => navigate({ kind: 'home' })}
          onMouseEnter={() => setHoverBtn('home')}
          onMouseLeave={() => setHoverBtn(null)}
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
            backgroundColor:
              route.kind === 'home'
                ? colors.selected
                : hoverBtn === 'home'
                  ? colors.hover
                  : 'transparent',
          }}
        >
          <Icons.Home size={14} color={route.kind === 'home' ? colors.text : colors.textMuted} />
          <text
            style={{
              fontSize: 13,
              fontWeight: route.kind === 'home' ? '500' : '400',
              color: route.kind === 'home' ? colors.text : colors.textMuted,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Home'}
          </text>
        </div>

        {/* Primary nav: Shared with me */}
        <div
          testId="nav-shared"
          onClick={() => navigate({ kind: 'shared' })}
          onMouseEnter={() => setHoverBtn('shared')}
          onMouseLeave={() => setHoverBtn(null)}
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
            backgroundColor:
              route.kind === 'shared'
                ? colors.selected
                : hoverBtn === 'shared'
                  ? colors.hover
                  : 'transparent',
          }}
        >
          <Icons.Users size={14} color={route.kind === 'shared' ? colors.text : colors.textMuted} />
          <text
            style={{
              fontSize: 13,
              fontWeight: route.kind === 'shared' ? '500' : '400',
              color: route.kind === 'shared' ? colors.text : colors.textMuted,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Shared with me'}
          </text>
        </div>

        {/* Primary nav: Chat with accordion */}
        <div
          testId="nav-chat"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            onClick={() => navigate({ kind: 'chat', sessionId: null })}
            onMouseEnter={() => setHoverBtn('chat_root')}
            onMouseLeave={() => setHoverBtn(null)}
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
              backgroundColor:
                route.kind === 'chat' && !route.sessionId
                  ? colors.selected
                  : hoverBtn === 'chat_root'
                    ? colors.hover
                    : 'transparent',
            }}
          >
            <Icons.MessageSquare
              size={14}
              color={route.kind === 'chat' ? colors.text : colors.textMuted}
            />
            <text
              style={{
                fontSize: 13,
                fontWeight: route.kind === 'chat' ? '500' : '400',
                color: route.kind === 'chat' ? colors.text : colors.textMuted,
                fontFamily: FONT_SANS,
                flexGrow: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {'Chat'}
            </text>
            <div
              onClick={(e: any) => {
                e.stopPropagation?.()
                navigate({ kind: 'chat', sessionId: null })
              }}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icons.Plus size={12} color={colors.textSubtle} />
            </div>
          </div>

          {/* Chat sub-threads */}
          {chatSessions.slice(0, 5).map((session) => {
            const isSelected = route.kind === 'chat' && route.sessionId === session.id
            const isHover = hoverBtn === `chat_${session.id}`
            return (
              <div
                key={session.id}
                onClick={() => navigate({ kind: 'chat', sessionId: session.id })}
                onMouseEnter={() => setHoverBtn(`chat_${session.id}`)}
                onMouseLeave={() => setHoverBtn(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 28,
                  borderRadius: 6,
                  paddingLeft: 28,
                  paddingRight: 8,
                  cursor: 'pointer',
                  backgroundColor: isSelected
                    ? colors.selected
                    : isHover
                      ? colors.hover
                      : 'transparent',
                }}
              >
                <text
                  style={{
                    fontSize: 12.5,
                    color: isSelected ? colors.text : colors.textMuted,
                    fontFamily: FONT_SANS,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {session.title || 'New chat'}
                </text>
              </div>
            )
          })}
        </div>

        {/* SPACES HEADER */}
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
            {'Spaces'}
          </text>
        </div>

        {/* My Notes (Private Space) */}
        <div
          testId="space-my-notes"
          onClick={() => navigate({ kind: 'space', spaceId: MY_NOTES_SPACE })}
          onMouseEnter={() => setHoverBtn('my_notes')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 30,
            borderRadius: 8,
            paddingLeft: 8,
            paddingRight: 8,
            cursor: 'pointer',
            backgroundColor:
              route.kind === 'space' && route.spaceId === MY_NOTES_SPACE
                ? colors.selected
                : hoverBtn === 'my_notes'
                  ? colors.hover
                  : 'transparent',
          }}
        >
          <Icons.Lock
            size={13}
            color={route.kind === 'space' && route.spaceId === MY_NOTES_SPACE ? colors.text : colors.textMuted}
          />
          <text
            style={{
              fontSize: 12.5,
              fontWeight: route.kind === 'space' && route.spaceId === MY_NOTES_SPACE ? '500' : '400',
              color: route.kind === 'space' && route.spaceId === MY_NOTES_SPACE ? colors.text : colors.textMuted,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'My notes'}
          </text>
        </div>

        {/* Private folders */}
        {privateFolders.map((f) => {
          const isSelected = route.kind === 'space' && route.spaceId === f.id
          const isHover = hoverBtn === `folder_${f.id}`
          return (
            <div
              key={f.id}
              onClick={() => navigate({ kind: 'space', spaceId: f.id })}
              onMouseEnter={() => setHoverBtn(`folder_${f.id}`)}
              onMouseLeave={() => setHoverBtn(null)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 28,
                borderRadius: 6,
                paddingLeft: 20,
                paddingRight: 8,
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? colors.selected
                  : isHover
                    ? colors.hover
                    : 'transparent',
              }}
            >
              <Icons.Folder size={12} color={isSelected ? colors.text : colors.textMuted} />
              <text
                style={{
                  fontSize: 12.5,
                  color: isSelected ? colors.text : colors.textMuted,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {f.name}
              </text>
            </div>
          )
        })}

        {/* Add Folder button (private) */}
        <div
          onClick={() => setShowFolderModal({ shared: false })}
          onMouseEnter={() => setHoverBtn('add_private_folder')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 26,
            borderRadius: 6,
            paddingLeft: 20,
            paddingRight: 8,
            cursor: 'pointer',
            backgroundColor: hoverBtn === 'add_private_folder' ? colors.hover : 'transparent',
          }}
        >
          <Icons.FolderPlus size={12} color={colors.textSubtle} />
          <text
            style={{
              fontSize: 12,
              color: colors.textSubtle,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Add folder'}
          </text>
        </div>

        {/* Team space */}
        <div
          testId="space-team"
          onClick={() => navigate({ kind: 'space', spaceId: TEAM_SPACE })}
          onMouseEnter={() => setHoverBtn('team_space')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 30,
            borderRadius: 8,
            paddingLeft: 8,
            paddingRight: 8,
            marginTop: 6,
            cursor: 'pointer',
            backgroundColor:
              route.kind === 'space' && route.spaceId === TEAM_SPACE
                ? colors.selected
                : hoverBtn === 'team_space'
                  ? colors.hover
                  : 'transparent',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <text
              style={{
                fontSize: 9.5,
                fontWeight: '700',
                color: colors.accentFg,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {workspaceName.charAt(0)}
            </text>
          </div>
          <text
            style={{
              fontSize: 12.5,
              fontWeight: route.kind === 'space' && route.spaceId === TEAM_SPACE ? '500' : '400',
              color: route.kind === 'space' && route.spaceId === TEAM_SPACE ? colors.text : colors.textMuted,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {teamLabel}
          </text>
        </div>

        {/* Shared folders */}
        {sharedFolders.map((f) => {
          const isSelected = route.kind === 'space' && route.spaceId === f.id
          const isHover = hoverBtn === `folder_${f.id}`
          return (
            <div
              key={f.id}
              onClick={() => navigate({ kind: 'space', spaceId: f.id })}
              onMouseEnter={() => setHoverBtn(`folder_${f.id}`)}
              onMouseLeave={() => setHoverBtn(null)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 28,
                borderRadius: 6,
                paddingLeft: 20,
                paddingRight: 8,
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? colors.selected
                  : isHover
                    ? colors.hover
                    : 'transparent',
              }}
            >
              <Icons.Folder size={12} color={isSelected ? colors.text : colors.textMuted} />
              <text
                style={{
                  fontSize: 12.5,
                  color: isSelected ? colors.text : colors.textMuted,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {f.name}
              </text>
            </div>
          )
        })}

        {/* Add Folder button (shared) */}
        <div
          onClick={() => setShowFolderModal({ shared: true })}
          onMouseEnter={() => setHoverBtn('add_shared_folder')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 26,
            borderRadius: 6,
            paddingLeft: 20,
            paddingRight: 8,
            cursor: 'pointer',
            backgroundColor: hoverBtn === 'add_shared_folder' ? colors.hover : 'transparent',
          }}
        >
          <Icons.FolderPlus size={12} color={colors.textSubtle} />
          <text
            style={{
              fontSize: 12,
              color: colors.textSubtle,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {'Add folder'}
          </text>
        </div>
      </div>

      {/* FOOTER: Directory shortcuts & Profile */}
      <div
        style={{
          borderTopWidth: 1,
          borderColor: colors.border,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {/* Directory icons strip */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingLeft: 4,
            paddingRight: 4,
          }}
        >
          {/* Templates */}
          <div
            onClick={() => navigate({ kind: 'settings', tab: 'spaces' })}
            onMouseEnter={() => setHoverBtn('footer_templates')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: hoverBtn === 'footer_templates' ? colors.hover : 'transparent',
            }}
          >
            <Icons.Compass size={14} color={colors.textMuted} />
          </div>

          {/* People */}
          <div
            testId="footer-people"
            onClick={() => navigate({ kind: 'people' })}
            onMouseEnter={() => setHoverBtn('footer_people')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor:
                route.kind === 'people'
                  ? colors.selected
                  : hoverBtn === 'footer_people'
                    ? colors.hover
                    : 'transparent',
            }}
          >
            <Icons.User
              size={14}
              color={route.kind === 'people' ? colors.text : colors.textMuted}
            />
          </div>

          {/* Companies */}
          <div
            testId="footer-companies"
            onClick={() => navigate({ kind: 'companies' })}
            onMouseEnter={() => setHoverBtn('footer_companies')}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor:
                route.kind === 'companies'
                  ? colors.selected
                  : hoverBtn === 'footer_companies'
                    ? colors.hover
                    : 'transparent',
            }}
          >
            <Icons.Building2
              size={14}
              color={route.kind === 'companies' ? colors.text : colors.textMuted}
            />
          </div>
        </div>

        {/* User Workspace Profile Card */}
        <div
          testId="user-profile-button"
          onClick={() => openSettings('preferences')}
          onMouseEnter={() => setHoverBtn('footer_profile')}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 36,
            borderRadius: 8,
            paddingLeft: 6,
            paddingRight: 8,
            cursor: 'pointer',
            backgroundColor: hoverBtn === 'footer_profile' ? colors.hover : 'transparent',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              backgroundColor: colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.accentFg,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {workspaceName.charAt(0)}
            </text>
          </div>
          <text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.text,
              fontFamily: FONT_SANS,
              flexGrow: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {profile.name}
          </text>
          <Icons.ChevronsUpDown size={14} color={colors.textSubtle} />
        </div>
      </div>

      {/* Add Folder Modal */}
      {showFolderModal && (
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
            padding: 16,
          }}
        >
          <div
            style={{
              width: 280,
              borderRadius: 12,
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.text,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {showFolderModal.shared ? 'New Team Folder' : 'New Private Folder'}
            </text>
            <input
              value={folderDraft}
              placeholder="Folder name"
              style={{
                height: 32,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                backgroundColor: colors.surface,
                paddingLeft: 8,
                paddingRight: 8,
                fontSize: 13,
                color: colors.text,
              }}
              onChange={(e: any) => setFolderDraft(e.value ?? '')}
              onSubmit={handleCreateFolder}
            />
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <div
                onClick={() => setShowFolderModal(null)}
                style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  height: 28,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                  {'Cancel'}
                </text>
              </div>
              <div
                onClick={handleCreateFolder}
                style={{
                  paddingLeft: 12,
                  paddingRight: 12,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: colors.solid,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.solidFg,
                    fontFamily: FONT_SANS,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {'Create'}
                </text>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
