/**
 * Integration tests for the Bagrry desktop app rendered with GPUIX.
 * Tested through the GPUIX native test renderer, verifying that the real tree
 * is built, painted, and hit tested with full fidelity.
 *
 *   bun run test
 */

import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { connectTest } from '@gpuix/react/automation'
import { createTestRoot, hasNativeTestRenderer } from '@gpuix/react/testing'
import { BagrryApp } from './app'
import { useBagrryStore, SEED_ACTION_ITEMS } from './src/store/bagrry-store'

const describeNative = hasNativeTestRenderer ? describe : describe.skip

describeNative('Bagrry desktop application', () => {
  beforeEach(() => {
    useBagrryStore.setState({
      route: { kind: 'home' },
      recState: 'idle',
      paletteOpen: false,
      onboardingOpen: false,
      actionItems: JSON.parse(JSON.stringify(SEED_ACTION_ITEMS)),
    })
  })

  it('mounts the sidebar, coming up card, action items, and note list on Home', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    const painted = renderer.getPaintedText()

    // Sidebar items
    expect(painted).toContain('Home')
    expect(painted).toContain('Shared with me')
    expect(painted).toContain('Chat')
    expect(painted).toContain('Spaces')
    expect(painted).toContain('My notes')

    // Home Page sections
    expect(painted).toContain('Coming up')
    expect(painted).toContain('Action items')
    expect(painted).toContain('New note')

    await app.close()
  })

  it('navigates between Home, Shared, Chat, Spaces, People, and Settings', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Navigate to Shared
    await app.getByTestId('nav-shared').click()
    expect(renderer.getPaintedText()).toContain('Shared with me')

    // Navigate to Chat
    await app.getByTestId('nav-chat').click()
    expect(renderer.getPaintedText().join(' ')).toMatch(/ask anything|Chat/)

    // Navigate to People via footer
    await app.getByTestId('footer-people').click()
    expect(renderer.getPaintedText()).toContain('People')
    expect(renderer.getPaintedText()).toContain('Everyone')

    // Navigate to Companies via footer
    await app.getByTestId('footer-companies').click()
    expect(renderer.getPaintedText()).toContain('Companies')

    // Open User Settings
    await app.getByTestId('user-profile-button').click()
    expect(renderer.getPaintedText()).toContain('Settings')
    expect(renderer.getPaintedText()).toContain('Preferences')

    await app.close()
  })

  it('opens a note and toggles between Scratchpad Notes and Enhanced Notes', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Click first note in note list
    await app.getByTestId('note-row-note_roadmap_sync').click()
    expect(renderer.getPaintedText().join(' ')).toContain('Q4 Product Roadmap')

    // Check tabs
    await app.getByTestId('tab-enhanced').click()
    expect(renderer.getPaintedText().join(' ')).toContain('Executive Summary')

    await app.getByTestId('tab-notes').click()
    expect(renderer.getPaintedText().join(' ')).toContain('Discussion on porting Bagrry from Tauri to GPUI')

    await app.close()
  })

  it('starts and stops audio recording with VU meter and recording pill', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Open note
    await app.getByTestId('note-row-note_roadmap_sync').click()

    // Initially idle
    expect(useBagrryStore.getState().recState).toBe('idle')

    // Start recording
    await app.getByTestId('start-recording-btn').click()
    expect(useBagrryStore.getState().recState).toBe('recording')
    expect(renderer.getPaintedText().join(' ')).toContain('Recording')

    // Pause recording
    await app.getByTestId('pause-recording-btn').click()
    expect(useBagrryStore.getState().recState).toBe('paused')

    // Stop recording
    await app.getByTestId('stop-recording-btn').click()
    expect(useBagrryStore.getState().recState).toBe('idle')

    await app.close()
  })

  it('opens and closes command palette', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Open palette from sidebar button
    await app.getByTestId('sidebar-search-button').click()
    expect(useBagrryStore.getState().paletteOpen).toBe(true)
    expect(renderer.getPaintedText().join(' ')).toContain('Search notes or jump to')

    // Close palette
    await app.getByTestId('command-palette-backdrop').click()
    expect(useBagrryStore.getState().paletteOpen).toBe(false)

    await app.close()
  })

  it('renders rich note editor with formatting toolbar and extracts AI actions', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Open note
    await app.getByTestId('note-row-note_roadmap_sync').click()

    // Rich note editor formatting toolbar items should be painted
    const painted = renderer.getPaintedText().join(' ')
    expect(painted).toContain('H1')
    expect(painted).toContain('H2')
    expect(painted).toContain('Summarise')
    expect(painted).toContain('Actions')
    expect(painted).toContain('Email')

    // AI action button Extract Actions
    const initialActionsCount = useBagrryStore.getState().actionItems.length
    await app.getByTestId('extract-actions-btn').click()
    expect(useBagrryStore.getState().actionItems.length).toBeGreaterThan(initialActionsCount)

    await app.close()
  })

  it('toggles and manages action items', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    // Find the first action item
    const firstItem = useBagrryStore.getState().actionItems[0]
    expect(firstItem.done).toBe(false)

    // Click toggle on first action item
    await app.getByTestId(`action-toggle-${firstItem.id}`).click()
    expect(useBagrryStore.getState().actionItems.find((i) => i.id === firstItem.id)?.done).toBe(true)

    await app.close()
  })
})
