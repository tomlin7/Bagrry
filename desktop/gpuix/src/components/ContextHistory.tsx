import React, { useState } from 'react'
import type { Compaction, Message, StepContext } from '../../engine/src/protocol'

/** The durable transcript stays readable on both sides of every boundary. */
export function ContextHistory({ messages, compactions, contexts }: {
  messages: Message[]
  compactions: Compaction[]
  contexts: StepContext[]
}) {
  const [open, setOpen] = useState(false)
  const latest = contexts.at(-1)
  if (!latest && compactions.length === 0) return null
  return (
    <div testId="session-context" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0,
      borderTopWidth: 1, borderColor: '#ffffff12', padding: 12, gap: 6 }}>
      <div testId="session-context-toggle" onClick={() => setOpen(!open)}
        style={{ display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', pointerEvents: 'auto' }}>
        <text style={{ fontSize: 11, color: '#a1a1aa', whiteSpace: 'nowrap' }}>
          {`${open ? 'Hide' : 'Show'} context · ${compactions.length} ${compactions.length === 1 ? 'compaction' : 'compactions'}`}
        </text>
        {latest && (
          <text style={{ fontSize: 10, color: '#71717a', whiteSpace: 'nowrap' }}>
            {`${latest.estimatedInput} input + ${latest.reservedOutput} reserved / ${latest.window}`}
          </text>
        )}
      </div>
      {open && (
        <div testId="session-context-history" style={{ height: 240, overflow: 'scroll', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contexts.filter((c) => c.changed.length > 0).map((context) => (
            <text key={context.id} style={{ fontSize: 11, color: '#a1a1aa' }}>
              {`Instruction sources changed: ${context.changed.join(', ')}`}
            </text>
          ))}
          {messages.map((message) => (
            <div key={message.id} style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, gap: 6 }}>
              <text style={{ fontSize: 11, color: '#d4d4d8' }}>{`${message.seq + 1} · ${message.role}: ${message.text}`}</text>
              {compactions.filter((c) => c.throughSeq === message.seq).map((boundary) => (
                <div key={boundary.id} testId={`context-boundary-${boundary.id}`}
                  style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, padding: 8,
                    borderLeftWidth: 2, borderColor: '#7c9b83', gap: 4 }}>
                  <text style={{ fontSize: 11, color: '#9cbaa3' }}>
                    {`Compacted through message ${boundary.throughSeq + 1} · ${boundary.reason === 'budget' ? 'context budget' : 'provider overflow'} · retained from ${boundary.retainedFromSeq + 1}`}
                  </text>
                  <text testId={`context-summary-${boundary.id}`} style={{ fontSize: 11, color: '#a1a1aa' }}>{boundary.text}</text>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
