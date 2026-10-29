'use client'

import React from 'react'
import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote:
      'Bagrry has completely replaced the frantic post-meeting scramble. It finds what I promised to ship and drafts the follow-up before I even switch tabs.',
    author: 'Elena Rostova',
    role: 'Head of Product',
    company: 'Veloce AI',
    avatar: 'ER',
  },
  {
    quote:
      'The zero-cloud-telemetry promise is real. Our enterprise security team approved Bagrry in 48 hours because all audio stays strictly on our local machines.',
    author: 'David Chen',
    role: 'VP of Engineering',
    company: 'HyperScale Systems',
    avatar: 'DC',
  },
  {
    quote:
      'The sentence citations are brilliant. When an action item surfaces, I can click straight back to the verbatim sentence in the transcript to verify context.',
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
