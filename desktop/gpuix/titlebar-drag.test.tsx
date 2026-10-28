/**
 * Titlebar dragging tests for Bagrry desktop app.
 *
 * The window has no native caption (titlebarTransparent: true), so the drag
 * is handled by custom titlebar regions. These tests drive the press through
 * the real GPUI hit test to ensure full hitbox coverage.
 */

import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { connectTest } from '@gpuix/react/automation'
import { createTestRoot, hasNativeTestRenderer } from '@gpuix/react/testing'
import { BagrryApp } from './app'
import { resetTitlebarPress, setWindowDragStarter } from './src/window-drag'

const describeNative = hasNativeTestRenderer ? describe : describe.skip

async function pressAt(app: any, testId: string, offsetX = 0) {
  const target = app.getByTestId(testId)
  await target.waitFor({ timeoutMs: 10_000 })
  const bounds = await target.bounds()
  const x = bounds.x + bounds.width / 2 + offsetX
  const y = bounds.y + bounds.height / 2
  await app.mouse.down({ x, y })
  await app.mouse.up({ x, y })
  return { x, y }
}

describeNative('Bagrry titlebar dragging', () => {
  afterEach(() => {
    setWindowDragStarter(null)
    resetTitlebarPress()
  })

  it('starts a window drag when the header titlebar is pressed', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    let drags = 0
    setWindowDragStarter(() => {
      drags += 1
      return true
    })

    await pressAt(app, 'titlebar-drag-header')
    expect(drags).toBe(1)

    await app.close()
  })

  it('starts a window drag when the sidebar titlebar is pressed', async () => {
    const { render, renderer } = createTestRoot({ width: 1200, height: 800 })
    render(<BagrryApp />)
    const app = await connectTest(renderer)

    let drags = 0
    setWindowDragStarter(() => {
      drags += 1
      return true
    })

    await pressAt(app, 'titlebar-drag-sidebar')
    expect(drags).toBe(1)

    await app.close()
  })
})
