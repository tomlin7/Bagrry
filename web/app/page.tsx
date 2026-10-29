'use client'

import React from 'react'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { SocialProof } from '@/components/SocialProof'
import { WorksLikeMagic } from '@/components/WorksLikeMagic'
import { OwnYourMemory } from '@/components/OwnYourMemory'
import { ContextSwitch } from '@/components/ContextSwitch'
import { McpShowcase } from '@/components/McpShowcase'
import { Testimonials } from '@/components/Testimonials'
import { Faq } from '@/components/Faq'
import { CtaBanner } from '@/components/CtaBanner'
import { Footer } from '@/components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-[#ff8133]/20 selection:text-black">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <WorksLikeMagic />
        <OwnYourMemory />
        <ContextSwitch />
        <McpShowcase />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
