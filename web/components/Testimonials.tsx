import React from 'react'
import { Card } from './ui/card'
import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote: "Bagrry is the first meeting tool that doesn't feel like an unwanted third wheel. No bots joining my calls, and the citations linking straight into the transcript are game-changing.",
    author: "Elena Rostova",
    role: "VP of Product",
    company: "Northwind Systems",
    avatar: "ER",
  },
  {
    quote: "The native GPUIX rendering makes it feel like a high-performance native OS utility. Instant window dragging, zero memory hogging, and 100% offline security.",
    author: "Marcus Brody",
    role: "Staff Infrastructure Engineer",
    company: "Helix AI",
    avatar: "MB",
  },
  {
    quote: "The Model Context Protocol integration is unbelievable. Claude Desktop and Cursor already know what we discussed in our morning sprint planning without me typing a word.",
    author: "David Kim",
    role: "Founder & CTO",
    company: "Vertex Labs",
    avatar: "DK",
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-neutral-50/60 dark:bg-neutral-900/40 border-y border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-[1140px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7e9900] dark:text-[#c3dd4f] block mb-3">
            Real Feedback
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Folks love Bagrry
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <Card key={idx} className="p-8 flex flex-col justify-between hover:scale-[1.01] transition-transform">
              <div className="mb-6">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm md:text-base leading-relaxed text-neutral-700 dark:text-neutral-300 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{t.author}</h4>
                  <p className="text-xs text-neutral-500">{t.role} · {t.company}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
