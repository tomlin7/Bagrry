'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'How can Bagrry help me?',
    a: 'Bagrry first creates memories to know you really well. Then it taps into this to find and automatically close open loops for you. If you context-switch frequently, this can be a life-saver for you.',
  },
  {
    q: 'What is memory?',
    a: 'Memory is your personal context. Just like your brain relies on your senses to see, hear or speak to create and store memories in the physical world, Bagrry does this for your digital activity on your device.',
  },
  {
    q: 'What is Bagrry MCP?',
    a: 'Bagrry MCP is like a digital pendrive that you can use to plug all your memories into any AI, including LLMs like Claude, ChatGPT, Cursor, etc and autonomous AI coding agents.',
  },
  {
    q: 'How private is my data?',
    a: "Your memory is stored on your device. We strictly do not store any of your private data on our servers. We don't retain your data or train on it.",
  },
  {
    q: 'Do you take screenshots?',
    a: "No, we don't take screenshots of your screen. We capture meeting audio and context natively via your local sound architecture and accessibility infrastructure on your device.",
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
