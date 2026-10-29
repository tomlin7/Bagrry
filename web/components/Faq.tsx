'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'How can Bagrry help me?',
    a: 'Bagrry is your AI meeting notepad for back-to-back calls. While you take rough scratchpad notes during a call, Bagrry captures dual-channel audio in the background, synthesizes structured summaries with sentence-level citations, and extracts high-value action items into your Open Loops Inbox.',
  },
  {
    q: 'What is memory in Bagrry?',
    a: 'Memory is your personal meeting knowledge base. Just like your brain recalls previous agreements and context, Bagrry organizes all past conversations, attendee dossiers, and decisions locally on your device so you never lose context.',
  },
  {
    q: 'What is Bagrry MCP?',
    a: 'Bagrry includes a built-in Model Context Protocol (MCP) server running locally on port 47821. It acts as a bridge to plug your meeting context, past decisions, and open loops into external AI tools like Claude Desktop, Cursor, ChatGPT, and autonomous AI agents.',
  },
  {
    q: 'How private is my meeting data?',
    a: "100% on-device confidentiality. Your audio, transcripts, and notes are stored in a local SQLite database with WAL mode on your computer. We do not store your data on cloud servers, retain logs, or train models on your private discussions.",
  },
  {
    q: 'Do meeting bots join my calls or do you take screenshots?',
    a: 'No meeting bots ever join your calls, and we never take intrusive screen captures. Bagrry captures meeting audio directly through native OS loopback (WASAPI on Windows, CoreAudio on macOS) and your local microphone.',
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
