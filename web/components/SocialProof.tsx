import React from 'react'

const COMPANIES = [
  'Linear',
  'Vercel',
  'Supabase',
  'OpenAI',
  'Stripe',
  'Figma',
  'Notion',
  'Retool',
]

export function SocialProof() {
  return (
    <section className="py-12 border-y border-black/[0.06] dark:border-white/[0.06] bg-neutral-50/50 dark:bg-neutral-900/30">
      <div className="max-w-[1140px] mx-auto px-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500 mb-6">
          TRUSTED BY BUILDERS & TEAMS AT
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {COMPANIES.map((company) => (
            <span
              key={company}
              className="text-base md:text-lg font-bold tracking-tight text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300 transition-colors select-none"
            >
              {company}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
