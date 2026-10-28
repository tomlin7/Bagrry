import React from 'react'
import { describe, expect, it } from 'vitest'
import { connectTest } from '@gpuix/react/automation'
import { createTestRoot, hasNativeTestRenderer } from '@gpuix/react/testing'
import { ContextHistory } from './ContextHistory'
import type { Compaction, Message, StepContext } from '../../engine/src/protocol'

const messages: Message[] = [
  { id: 'old', sessionID: 's', seq: 0, role: 'user', text: 'Keep the old requirement', at: 1 },
  { id: 'new', sessionID: 's', seq: 1, role: 'user', text: 'Continue the work', at: 2 },
]
const compaction: Compaction = { id: 'c', sessionID: 's', stepID: 'step', throughSeq: 0,
  retainedFromSeq: 1, text: 'Original goal: Keep the old requirement', reason: 'budget', at: 3 }
const context: StepContext = { id: 'ctx', sessionID: 's', stepID: 'step', attempt: 1,
  sources: [{ source: 'AGENTS.md', hash: 'abc' }], changed: ['AGENTS.md'],
  estimatedInput: 100, reservedOutput: 20, window: 200, compactionID: 'c', at: 4 }

;(hasNativeTestRenderer ? describe : describe.skip)('context history', () => {
  it('opens the original transcript, summary boundary and changed source names', async () => {
    const { render, renderer } = createTestRoot({ width: 381, height: 500 })
    render(
      <div style={{ display: 'flex', flexDirection: 'column', width: 381, height: 500, backgroundColor: '#212121' }}>
        <ContextHistory messages={messages} compactions={[compaction]} contexts={[context]} />
      </div>,
    )
    const app = await connectTest(renderer)
    try {
      expect(renderer.getPaintedText().join('\n')).toContain('1 compaction')
      await app.getByTestId('session-context-toggle').click()
      await app.getByTestId('context-summary-c').waitFor()
      const text = renderer.getPaintedText().join('\n')
      expect(text).toContain('Keep the old requirement')
      expect(text).toContain('Continue the work')
      expect(text).toContain('Compacted through message 1')
      expect(text).toContain('Original goal: Keep the old requirement')
      expect(text).toContain('Instruction sources changed: AGENTS.md')
      if (process.env.HIROSHI_CONTEXT_SCREENSHOT) {
        await app.screenshot({ path: process.env.HIROSHI_CONTEXT_SCREENSHOT })
      }
      await app.getByTestId('session-context-toggle').click()
      expect(renderer.getPaintedText().join('\n')).not.toContain('Original goal:')
    } finally { await app.close() }
  })
})
