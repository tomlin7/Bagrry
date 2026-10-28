import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_SANS } from '../../theme'

export function CreateFolderDialog() {
  const modal = useBagrryStore((s) => s.folderModal)
  const closeModal = useBagrryStore((s) => s.closeFolderModal)
  const createFolder = useBagrryStore((s) => s.createFolder)
  const navigate = useBagrryStore((s) => s.navigate)
  const colors = useBagrryStore((s) => s.colors)

  const [name, setName] = useState('')

  if (!modal?.open) return null

  const handleCreate = () => {
    if (!name.trim()) return
    const folder = createFolder(name.trim(), modal.shared)
    setName('')
    closeModal()
    navigate({ kind: 'space', spaceId: folder.id })
  }

  return (
    <div
      testId="create-folder-backdrop"
      onClick={closeModal}
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
        testId="create-folder-modal"
        onClick={(e: any) => e.stopPropagation?.()}
        style={{
          width: 320,
          borderRadius: 14,
          backgroundColor: colors.elevated,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icons.Folder size={16} color={colors.accent} />
            <text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.text,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {modal.shared ? 'New team folder' : 'New private folder'}
            </text>
          </div>
          <div
            onClick={closeModal}
            style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Icons.X size={14} color={colors.textSubtle} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <text style={{ fontSize: 11.5, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
            {'Folder Name'}
          </text>
          <input
            testId="create-folder-input"
            value={name}
            placeholder="e.g. Design Critiques"
            style={{
              height: 34,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingLeft: 10,
              paddingRight: 10,
              fontSize: 13,
              color: colors.text,
              fontFamily: FONT_SANS,
            }}
            onChange={(e: any) => setName(e.value ?? '')}
            onSubmit={handleCreate}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <div
            onClick={closeModal}
            style={{
              paddingLeft: 12,
              paddingRight: 12,
              height: 30,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
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
            testId="create-folder-confirm"
            onClick={handleCreate}
            style={{
              paddingLeft: 14,
              paddingRight: 14,
              height: 30,
              borderRadius: 6,
              backgroundColor: colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <text style={{ fontSize: 12, fontWeight: '600', color: colors.accentFg, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
              {'Create folder'}
            </text>
          </div>
        </div>
      </div>
    </div>
  )
}
