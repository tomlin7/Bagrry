'use client'

import React from 'react'

export function Footer() {
  return (
    <footer className="py-16 border-t border-black/[0.08] bg-white text-neutral-500 text-sm">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          {/* Brand & Tagline */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
                B
              </div>
              <span className="font-bold text-neutral-900 text-base">
                Bagrry
              </span>
            </div>
            <p className="text-neutral-500 text-sm">
              The AI notepad for back-to-back meetings
            </p>
          </div>

          {/* Legal Links matching projectminimi */}
          <div className="flex flex-wrap items-center gap-6 text-[14px] text-neutral-600 font-medium">
            <a href="#privacy" className="hover:text-black transition-colors">
              Privacy policy
            </a>
            <a href="#terms" className="hover:text-black transition-colors">
              Terms of service
            </a>
            <a href="#refund" className="hover:text-black transition-colors">
              Refund policy
            </a>
            <a href="#disclosure" className="hover:text-black transition-colors">
              Disclosure
            </a>
            <a href="mailto:support@bagrry.dev" className="hover:text-black transition-colors">
              Contact us
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400 text-xs">
          <span>© 2026 Bagrry Intelligence, Inc.</span>
          <span>Local Whisper STT · SQLite WAL Storage · Model Context Protocol</span>
        </div>
      </div>
    </footer>
  )
}
