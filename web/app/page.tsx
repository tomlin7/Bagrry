import React from 'react'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { SocialProof } from '@/components/SocialProof'
import { WorksLikeMagic } from '@/components/WorksLikeMagic'
import { OwnYourMemory } from '@/components/OwnYourMemory'
import { McpShowcase } from '@/components/McpShowcase'
import { Testimonials } from '@/components/Testimonials'
import { Faq } from '@/components/Faq'
import { CtaBanner } from '@/components/CtaBanner'
import { Footer } from '@/components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] dark:bg-[#161614] text-neutral-900 dark:text-neutral-100 selection:bg-[#c3dd4f] selection:text-[#1e2604] antialiased">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <WorksLikeMagic />
        <OwnYourMemory />
        <McpShowcase />
        <Testimonials />
        <Faq />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
