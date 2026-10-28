import React, { useState } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { Icons } from '../icons'
import { FONT_DISPLAY, FONT_MONO, FONT_SANS } from '../../theme'
import {
  ActionButton,
  Badge,
  QuietInput,
  SettingRow,
  SettingsCard,
  TabHeading,
} from './shared'

export function WorkspaceGeneralTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const profile = useBagrryStore((s) => s.profile)
  const setProfile = useBagrryStore((s) => s.setProfile)
  const [workspaceName, setWorkspaceName] = useState(profile.workspace)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="General" description="Workspace-wide settings." />

      <SettingsCard title="Workspace details">
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QuietInput
            testId="workspace-name-input"
            value={workspaceName}
            onChange={setWorkspaceName}
            placeholder="Workspace name"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <ActionButton
              testId="save-workspace-btn"
              variant="solid"
              disabled={!workspaceName.trim()}
              onClick={() => {
                setProfile(profile.name, profile.email, workspaceName.trim())
                onNotice('Workspace renamed')
              }}
            >
              {'Save changes'}
            </ActionButton>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Permissions & Environment">
        <SettingRow
          title="Storage Mode"
          description="Local-first on-device encrypted SQLite store."
          control={<Badge tone="accent">Local SQLite</Badge>}
        />
        <SettingRow
          title="Team Sync"
          description="Offline peer sync available for team workspaces."
          control={<Badge tone="success">Ready</Badge>}
        />
      </SettingsCard>
    </div>
  )
}

export function MembersTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const colors = useBagrryStore((s) => s.colors)
  const people = useBagrryStore((s) => s.people)
  const addPerson = useBagrryStore((s) => s.addPerson)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Members" description="People who show up as attendees on your notes." />

      <SettingsCard title="Add someone">
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <QuietInput
            testId="member-name-input"
            value={name}
            onChange={setName}
            placeholder="Full name (e.g. Elena Rostova)"
          />
          <QuietInput
            testId="member-email-input"
            value={email}
            onChange={setEmail}
            placeholder="email@company.com"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <ActionButton
              testId="add-member-btn"
              variant="solid"
              disabled={!name.trim()}
              onClick={() => {
                addPerson(name.trim(), email.trim() || undefined)
                setName('')
                setEmail('')
                onNotice('Person added')
              }}
            >
              {'Add person'}
            </ActionButton>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={`${people.length} people in workspace`}>
        {people.map((p) => {
          const initials = p.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <SettingRow
              key={p.id}
              testId={`member-row-${p.id}`}
              icon={
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <text style={{ fontSize: 10.5, fontWeight: '700', color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                    {initials}
                  </text>
                </div>
              }
              title={p.name}
              description={p.email || p.domain || 'Team attendee'}
              control={p.is_me ? <Badge tone="accent">You</Badge> : <Badge>{`${p.note_count || 0} notes`}</Badge>}
            />
          )
        })}
      </SettingsCard>
    </div>
  )
}

export function SpacesTab({ onNotice }: { onNotice: (msg: string) => void }) {
  const folders = useBagrryStore((s) => s.folders)
  const templates = useBagrryStore((s) => s.templates)
  const recipes = useBagrryStore((s) => s.recipes)
  const addTemplate = useBagrryStore((s) => s.addTemplate)
  const addRecipe = useBagrryStore((s) => s.addRecipe)

  const [tplName, setTplName] = useState('')
  const [tplPrompt, setTplPrompt] = useState('')
  const [rcpName, setRcpName] = useState('')
  const [rcpPrompt, setRcpPrompt] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Spaces" description="Folders, templates and recipes in this workspace." />

      {/* Folders */}
      <SettingsCard title="Folders">
        {folders.map((f) => (
          <SettingRow
            key={f.id}
            testId={`space-folder-${f.id}`}
            title={f.name}
            description={f.description || (f.is_shared ? 'Shared with the workspace' : 'Private')}
            control={f.is_shared ? <Badge tone="accent">Shared</Badge> : <Badge>Private</Badge>}
          />
        ))}
      </SettingsCard>

      {/* Templates */}
      <SettingsCard title="Templates">
        {templates.map((tpl) => (
          <SettingRow
            key={tpl.id}
            testId={`template-row-${tpl.id}`}
            title={tpl.name}
            description={tpl.prompt_template}
          />
        ))}
      </SettingsCard>

      {/* Recipes */}
      <SettingsCard title="Recipes">
        {recipes.map((rcp) => (
          <SettingRow
            key={rcp.id}
            testId={`recipe-row-${rcp.id}`}
            title={rcp.name}
            description={rcp.prompt_template}
          />
        ))}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <QuietInput
            testId="recipe-name-input"
            value={rcpName}
            onChange={setRcpName}
            placeholder="Recipe name (e.g. Sales Objection Handler)"
          />
          <QuietInput
            testId="recipe-prompt-input"
            value={rcpPrompt}
            onChange={setRcpPrompt}
            placeholder="AI prompt template…"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <ActionButton
              testId="add-recipe-btn"
              variant="solid"
              disabled={!rcpName.trim() || !rcpPrompt.trim()}
              onClick={() => {
                addRecipe(rcpName.trim(), rcpPrompt.trim())
                setRcpName('')
                setRcpPrompt('')
                onNotice('Recipe saved')
              }}
            >
              {'Add recipe'}
            </ActionButton>
          </div>
        </div>
      </SettingsCard>

      {/* New Template Form */}
      <SettingsCard title="New template">
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <QuietInput
            testId="template-name-input"
            value={tplName}
            onChange={setTplName}
            placeholder="Template name (e.g. Customer Sprint Demo)"
          />
          <QuietInput
            testId="template-prompt-input"
            value={tplPrompt}
            onChange={setTplPrompt}
            placeholder="Prompt template instructions…"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <ActionButton
              testId="add-template-btn"
              variant="solid"
              disabled={!tplName.trim() || !tplPrompt.trim()}
              onClick={() => {
                addTemplate(tplName.trim(), tplPrompt.trim())
                setTplName('')
                setTplPrompt('')
                onNotice('Template saved')
              }}
            >
              {'Add template'}
            </ActionButton>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}

export function AnalyticsTab() {
  const colors = useBagrryStore((s) => s.colors)
  const meetings = useBagrryStore((s) => s.meetings)
  const actionItems = useBagrryStore((s) => s.actionItems)
  const folders = useBagrryStore((s) => s.folders)

  const enhancedCount = meetings.filter((m) => !!m.enhanced_notes_json).length
  const totalMs = meetings.reduce((sum, m) => sum + (m.duration_ms || 0), 0)
  const openActions = actionItems.filter((a) => !a.done).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TabHeading title="Analytics" />

      {/* 4 Stat Cards */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            flexGrow: 1,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <text style={{ fontSize: 28, fontFamily: FONT_DISPLAY, fontWeight: '700', color: colors.text, whiteSpace: 'nowrap' }}>
            {`${meetings.length}`}
          </text>
          <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
            {'Notes captured'}
          </text>
        </div>

        <div
          style={{
            flexGrow: 1,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <text style={{ fontSize: 28, fontFamily: FONT_DISPLAY, fontWeight: '700', color: colors.accent, whiteSpace: 'nowrap' }}>
            {`${enhancedCount}`}
          </text>
          <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
            {'Notes enhanced'}
          </text>
        </div>

        <div
          style={{
            flexGrow: 1,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <text style={{ fontSize: 28, fontFamily: FONT_DISPLAY, fontWeight: '700', color: colors.text, whiteSpace: 'nowrap' }}>
            {`${openActions}`}
          </text>
          <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
            {'Open action items'}
          </text>
        </div>

        <div
          style={{
            flexGrow: 1,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <text style={{ fontSize: 28, fontFamily: FONT_DISPLAY, fontWeight: '700', color: colors.text, whiteSpace: 'nowrap' }}>
            {`${(totalMs / 3_600_000).toFixed(1)}`}
          </text>
          <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
            {'Hours recorded'}
          </text>
        </div>
      </div>

      {/* Distribution by space */}
      <SettingsCard title="Space Distribution">
        {folders.map((f) => {
          const count = meetings.filter((m) => m.folder_id === f.id).length
          const pct = meetings.length > 0 ? Math.round((count / meetings.length) * 100) : 0
          return (
            <div
              key={f.id}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
            >
              <text style={{ fontSize: 13, color: colors.text, fontFamily: FONT_SANS, whiteSpace: 'nowrap' }}>
                {f.name}
              </text>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <text style={{ fontSize: 12, color: colors.textMuted, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>
                  {`${count} notes (${pct}%)`}
                </text>
                <div style={{ width: 60, height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.accent }} />
                </div>
              </div>
            </div>
          )
        })}
      </SettingsCard>
    </div>
  )
}
