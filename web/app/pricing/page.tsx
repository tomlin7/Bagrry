'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PLANS = [
  {
    name: 'Basic',
    price: '$0',
    popular: false,
    pitch: 'Unlimited local notes for individuals',
    features: [
      'Unlimited meeting notes & scratchpad',
      'Dual-channel microphone & loopback audio',
      'Verbatim transcripts with sentence citations',
      'Model Context Protocol (MCP) on port 47821',
      'Local SQLite storage with WAL mode',
      'Offline Whisper speech-to-text',
    ],
    cta: 'Download Free',
    href: '/download',
  },
  {
    name: 'Business',
    price: '$14',
    popular: true,
    pitch: 'For teams that live in back-to-back calls',
    features: [
      'Everything in Basic',
      'Public interactive Web Share links (/s/:token)',
      'Shared folders & team workspace spaces',
      'Webhooks (Slack, Notion, Zapier, Attio)',
      'Whisper-large-v3-turbo high-speed cloud transcription',
      'Custom LLM synthesis instructions & recipes',
    ],
    cta: 'Get Started',
    href: '/download',
  },
  {
    name: 'Enterprise',
    price: '$35',
    popular: false,
    pitch: 'Security, compliance & custom governance',
    features: [
      'Everything in Business',
      'SAML 2.0 / Okta SSO & SCIM directory sync',
      'Audit logging & centralized retention rules',
      'Dedicated Groq & private cloud inference endpoints',
      '99.9% uptime SLA & priority support',
      'BAA & customized DPA agreements',
    ],
    cta: 'Contact Sales',
    href: 'mailto:sales@bagrry.dev',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] dark:bg-[#161614] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between antialiased">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-36 pb-24 text-center">
        <div className="flex justify-center mb-6">
          <Badge variant="dot" className="px-4 py-1.5 text-xs font-medium">
            Transparent Pricing · Cancel Anytime
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
          Unlimited notes. Zero meeting bots.
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-16 leading-relaxed">
          Start for free on your machine. Upgrade whenever your team needs collaborative web sharing and cloud speed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 md:p-10 flex flex-col justify-between relative transition-all duration-300 ${
                plan.popular
                  ? 'border-2 border-neutral-900 dark:border-white shadow-xl scale-[1.02] bg-white dark:bg-[#1f1f1d]'
                  : 'hover:border-black/[0.15] dark:hover:border-white/[0.15]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#c3dd4f] text-[#1e2604] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  {plan.name}
                </span>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl md:text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-neutral-500 font-medium">/ user / mo</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">{plan.pitch}</p>

                <div className="space-y-3.5 mb-8">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a href={plan.href} className="block mt-4">
                <Button
                  variant={plan.popular ? 'dark' : 'outline'}
                  size="pill"
                  className="w-full text-xs font-semibold"
                >
                  {plan.cta}
                </Button>
              </a>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
