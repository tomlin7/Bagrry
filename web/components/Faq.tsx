'use client'

import React, { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    q: 'How is Bagrry different from bot-based meeting recorders?',
    a: 'Traditional meeting tools send an intrusive bot into your call that announces recording and dumps a messy 10-page transcript nobody reads. Bagrry runs natively on your machine, captures audio directly via OS loopback with zero bots, and blends your human notes with AI enhancement.',
  },
  {
    q: 'How does Bagrry find open loops?',
    a: 'During the call, Bagrry analyzes the conversation in real-time, identifying commitments made by you and others, and organizes them into high-value action items automatically.',
  },
  {
    q: 'What are sentence-level citations?',
    a: 'Every bullet point created by the AI includes an interactive citation tag. Hovering or clicking it shows the exact sentence spoken by the attendee so you can verify context immediately.',
  },
  {
    q: 'What is the Local MCP Server?',
    a: 'Bagrry includes a built-in Model Context Protocol server on port 47821. It allows external AI tools like Claude Desktop and Cursor to query your meeting history and past decisions securely on your local device.',
  },
  {
    q: 'Where is my data stored and is it private?',
    a: '100% on-device confidentiality. Your audio, transcripts, and notes are stored locally in SQLite with WAL mode on your computer. We never train AI models on your private discussions or sell your data.',
  },
]

export function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx)
  }

  return (
    <section id="faqs" className="py-20 md:py-28 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        {/* Left-aligned title matching minimi */}
        <div className="mb-12 text-left">
          <h2 className="text-[36px] font-semibold tracking-tight text-black font-roboto">
            FAQs
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div
                key={idx}
                className="rounded-[24px] bg-[#f2f2f2] overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-medium text-[18px] text-black font-roboto cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-black" />
                    ) : (
                      <Plus className="w-4 h-4 text-black" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-[16px] leading-relaxed text-neutral-600 font-normal font-roboto">
                    <p className="pt-2">{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
