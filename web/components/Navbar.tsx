'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { Button } from './ui/button'

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
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        className={`pointer-events-auto flex items-center gap-3 sm:gap-6 px-4 sm:px-6 py-2.5 rounded-full transition-all duration-300 border ${
          scrolled
            ? 'bg-white/90 dark:bg-[#1c1c1c]/90 backdrop-blur-md border-black/[0.1] dark:border-white/[0.1] shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
            : 'bg-white/75 dark:bg-[#1c1c1c]/75 backdrop-blur-sm border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
        }`}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md bg-[#c3dd4f] flex items-center justify-center text-[#1e2604] font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
            B
          </div>
          <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
            Bagrry
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <a href="#works-like-magic" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Works like magic
          </a>
          <a href="#privacy" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Security & Memory
          </a>
          <a href="#mcp" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Memory MCP
          </a>
          <a href="#faqs" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            FAQs
          </a>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-2">
          <a href="/download">
            <Button
              variant="dark"
              size="sm"
              className="rounded-full text-xs font-medium px-4 h-8 gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </Button>
          </a>
        </div>
      </nav>
    </header>
  )
}
