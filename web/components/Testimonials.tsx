'use client'

import React from 'react'
import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote:
      'Bagrry is the first meeting app that doesn’t get in my way. I take three messy bullet points during a call, and it enhances them into an executive summary with clickable audio citations.',
    author: 'Elena Rostova',
    role: 'Head of Product',
    company: 'Veloce AI',
    avatar: 'ER',
  },
  {
    quote:
      'The no-bot approach is a total game changer. Clients never feel uncomfortable, and having every bullet point grounded directly in the verbatim transcript means zero hallucinations.',
    author: 'David Chen',
    role: 'VP of Engineering',
    company: 'HyperScale Systems',
    avatar: 'DC',
  },
  {
    quote:
      'The local MCP server connects directly to Claude and Cursor. I can ask my IDE what our architect agreed to in yesterday’s sync without digging through docs.',
    author: 'Maya Lin',
    role: 'Founder & CEO',
    company: 'Krypton Labs',
    avatar: 'ML',
  },
]

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[34px] sm:text-[42px] font-semibold tracking-tight text-black">
            Folks love Bagrry
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="rounded-[28px] border border-black/[0.08] bg-[#f7f7f7] p-8 flex flex-col justify-between shadow-xs hover:border-black/[0.15] transition-all"
            >
              <div className="mb-8">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                  ))}
                </div>
                <p className="text-[15px] leading-relaxed text-neutral-700 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-black/[0.06]">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">{t.author}</h4>
                  <p className="text-xs text-neutral-500">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
