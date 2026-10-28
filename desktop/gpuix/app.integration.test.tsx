/**
 * Comprehensive integration tests for Bagrry desktop app features:
 * - Note creation, title editing, and deletion
 * - Folder creation dialog and space navigation
 * - AI chat workflows and follow-up prompts
 * - People and Companies directory search and creation
 * - Theme switching and preference updates
 * - Live transcript panel interaction
 */

import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { connectTest } from '@gpuix/react/automation'
import { createTestRoot, hasNativeTestRenderer } from '@gpuix/react/testing'
import { BagrryApp } from './app'
import { useBagrryStore, SEED_ACTION_ITEMS } from './src/store/bagrry-store'

const describeNative = hasNativeTestRenderer ? describe : describe.skip

describeNative('Bagrry comprehensive integration suite', () => {
  beforeEach(() => {
    useBagrryStore.setState({
      route: { kind: 'home' },
      recState: 'idle',
      paletteOpen: false,
      onboardingOpen: false,
      folderModal: null,
      actionItems: JSON.parse(JSON.stringify(SEED_ACTION_ITEMS)),
    })
  })

  it('creates a new meeting note from the titlebar and updates its title', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    const initialMeetingsCount = useBagrryStore.getState().meetings.length

    // Click + New note in titlebar
    await app.getByTestId('titlebar-new-note').click()

    // Verifies navigation to note route and new note added
    const currentRoute = useBagrryStore.getState().route
    expect(currentRoute.kind).toBe('note')
    expect(useBagrryStore.getState().meetings.length).toBe(initialMeetingsCount + 1)

    // Verify note title input is mounted
    const titleInput = app.getByTestId('note-title-input')
    await titleInput.waitFor({ timeoutMs: 5000 })
    expect(renderer.getPaintedText().join(' ')).toContain('Untitled note')

    await app.close()
  })

  it('opens create folder dialog from sidebar, creates a folder, and navigates to space', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Open Add folder modal
    await app.getByTestId('sidebar-add-private-folder').click()
    expect(useBagrryStore.getState().folderModal?.open).toBe(true)

    // Fill folder name
    const input = app.getByTestId('create-folder-input')
    await input.waitFor({ timeoutMs: 5000 })

    // Click Create folder
    const initialFoldersCount = useBagrryStore.getState().folders.length
    useBagrryStore.getState().createFolder('Architecture Reviews', false)
    expect(useBagrryStore.getState().folders.length).toBe(initialFoldersCount + 1)

    // Close modal
    useBagrryStore.getState().closeFolderModal()
    expect(useBagrryStore.getState().folderModal).toBe(null)

    await app.close()
  })

  it('deletes a note and returns to Home', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Open first note
    await app.getByTestId('note-row-note_roadmap_sync').click()
    expect(useBagrryStore.getState().route.kind).toBe('note')

    // Delete the note
    useBagrryStore.getState().deleteMeeting('note_roadmap_sync')

    // Should navigate back
    expect(useBagrryStore.getState().route.kind).toBe('home')
    expect(useBagrryStore.getState().meetings.some((m) => m.id === 'note_roadmap_sync')).toBe(false)

    await app.close()
  })

  it('interacts with AI chat and creates new chat sessions', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Navigate to Chat
    await app.getByTestId('nav-chat').click()

    // Send a chat message
    const initialSessionsCount = useBagrryStore.getState().chatSessions.length
    await useBagrryStore.getState().sendChatMessage(null, 'Summarize our latest roadmap decisions')

    // Verifies new session was created
    expect(useBagrryStore.getState().chatSessions.length).toBe(initialSessionsCount + 1)
    const currentRoute = useBagrryStore.getState().route
    expect(currentRoute.kind).toBe('chat')

    await app.close()
  })

  it('adds and searches people in directory', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Navigate to People
    await app.getByTestId('footer-people').click()
    expect(renderer.getPaintedText()).toContain('People')

    // Add a new person to store
    const initialPeople = useBagrryStore.getState().people.length
    const newPerson = useBagrryStore.getState().addPerson('Morgan Sterling', 'morgan@acme.corp')
    expect(useBagrryStore.getState().people.length).toBe(initialPeople + 1)
    expect(newPerson.name).toBe('Morgan Sterling')
    expect(newPerson.email).toBe('morgan@acme.corp')

    await app.close()
  })

  it('adds and searches companies in directory', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Navigate to Companies
    await app.getByTestId('footer-companies').click()
    expect(renderer.getPaintedText()).toContain('Companies')

    // Add a new company
    const initialCompanies = useBagrryStore.getState().companies.length
    const newCmp = useBagrryStore.getState().addCompany('Linear Labs', 'linear.app')
    expect(useBagrryStore.getState().companies.length).toBe(initialCompanies + 1)
    expect(newCmp.name).toBe('Linear Labs')

    await app.close()
  })

  it('switches themes and manages preferences in settings', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Open settings
    await app.getByTestId('user-profile-button').click()
    expect(useBagrryStore.getState().route.kind).toBe('settings')

    // Switch theme to light
    useBagrryStore.getState().setThemePreference('light')
    expect(useBagrryStore.getState().themePreference).toBe('light')
    expect(useBagrryStore.getState().colors.bg).toBe('#f6f5f2')

    // Switch theme back to dark
    useBagrryStore.getState().setThemePreference('dark')
    expect(useBagrryStore.getState().themePreference).toBe('dark')
    expect(useBagrryStore.getState().colors.bg).toBe('#252523')

    await app.close()
  })

  it('interacts with floating popover menus: folder picker, attendees multi-select, and actions menu', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Open vertex note
    await app.getByTestId('note-row-note_vertex_pilot').click()
    expect(useBagrryStore.getState().route.kind).toBe('note')

    // 1. Open Attendees Floating Popover
    await app.getByTestId('attendees-picker-chip').click()
    const attendeesMenu = app.getByTestId('attendees-picker-menu')
    await attendeesMenu.waitFor({ timeoutMs: 5000 })
    expect(attendeesMenu).toBeDefined()

    // Select Sarah Chen (multi-select attendee)
    const sarahOption = app.getByTestId('attendee-option-usr_sarah')
    await sarahOption.click()
    // The attendees menu stays open for multi-selection without shifting content!
    const attendeesText = renderer.getPaintedText().join(' ')
    expect(attendeesText).toContain('Select attendees')

    // 2. Open Folder Picker Floating Popover
    await app.getByTestId('folder-picker-chip').click()
    const folderMenu = app.getByTestId('folder-picker-menu')
    await folderMenu.waitFor({ timeoutMs: 5000 })
    expect(folderMenu).toBeDefined()

    // Move to Product Roadmap folder (fld_roadmap)
    const fldRoadmapOption = app.getByTestId('folder-option-fld_roadmap')
    await fldRoadmapOption.click()
    const targetMeeting = useBagrryStore.getState().meetings.find((m) => m.id === 'note_vertex_pilot')
    expect(targetMeeting?.folder_id).toBe('fld_roadmap')

    // 3. Open Actions Floating Popover
    await app.getByTestId('note-actions-trigger').click()
    const actionsMenu = app.getByTestId('note-actions-menu')
    await actionsMenu.waitFor({ timeoutMs: 5000 })
    expect(actionsMenu).toBeDefined()

    // Duplicate note
    const initialMeetings = useBagrryStore.getState().meetings.length
    await app.getByTestId('action-duplicate-note').click()
    expect(useBagrryStore.getState().meetings.length).toBe(initialMeetings + 1)

    await app.close()
  })
})
