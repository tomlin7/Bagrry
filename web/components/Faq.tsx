'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'How is Bagrry different from bot-based meeting recorders?',
    a: 'Traditional meeting tools send an intrusive bot into your call that announces recording and dumps a messy 10-page transcript nobody reads. Bagrry runs natively on your machine, captures audio directly via OS loopback with zero bots, and blends your human notes with AI enhancement.',
  },
  {
    q: 'How does the "Enhance" feature work?',
    a: 'During the call, you jot down quick, rough shorthand notes. Post-meeting, Bagrry merges your human emphasis with the verbatim audio transcript, filling in exact names, technical specs, and action items with sentence-level citations.',
  },
  {
    q: 'What are sentence-level citations?',
    a: 'Every bullet point created by the AI includes an interactive citation tag. Hovering or clicking it shows the exact sentence spoken by the attendee and gives you a 5-second audio scrubber to verify context immediately.',
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
    <section id="faqs" className="py-24 md:py-32 bg-white">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[34px] sm:text-[42px] font-semibold tracking-tight text-black">
            FAQs
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div
                key={idx}
                className="rounded-[20px] border border-black/[0.08] bg-[#f7f7f7] overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-[17px] text-black hover:text-neutral-700 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-black' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-[15px] leading-relaxed text-neutral-600 font-normal border-t border-black/[0.04]">
                    <p className="pt-3">{faq.a}</p>
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
