'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Download } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        className={`pointer-events-auto flex items-center justify-between w-full max-w-[860px] px-6 py-3 rounded-full transition-all duration-300 border ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-black/[0.1] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            : 'bg-white/85 backdrop-blur-sm border-black/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
        }`}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
            B
          </div>
          <span className="font-bold text-base tracking-tight text-neutral-900">
            Bagrry
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-[14px] font-medium text-neutral-500">
          <a href="#about" className="hover:text-black transition-colors">
            About
          </a>
          <a href="#how-it-works" className="hover:text-black transition-colors">
            How it works
          </a>
          <a href="#enhance" className="hover:text-black transition-colors">
            Enhance
          </a>
          <a href="#privacy" className="hover:text-black transition-colors">
            Privacy
          </a>
          <a href="#faqs" className="hover:text-black transition-colors">
            FAQs
          </a>
        </div>

        {/* Right Action Button */}
        <div className="flex items-center gap-3">
          <a href="/download">
            <button className="h-[38px] px-5 rounded-full bg-black hover:bg-neutral-800 text-white text-[13px] font-medium transition-all flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98]">
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </a>
        </div>
      </nav>
    </header>
  )
}
