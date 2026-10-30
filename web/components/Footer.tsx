'use client'

import React from 'react'

export function Footer() {
  return (
    <footer className="pt-16 pb-20 border-t border-black/[0.06] bg-white text-neutral-500">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          {/* Brand & Tagline */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs tracking-tighter">
                B
              </div>
              <span className="font-bold text-black text-[20px] font-roboto">
                Bagrry
              </span>
            </div>
            <p className="text-neutral-500 text-[16px] font-roboto font-normal">
              Your meeting context that stays on your device.
            </p>
          </div>

          {/* Legal Links matching minimi: 18-20px underline */}
          <div className="flex flex-wrap items-center gap-6 text-[18px] text-neutral-800 font-light font-roboto">
            <a href="#privacy" className="underline hover:text-black transition-colors">
              Privacy policy
            </a>
            <a href="#terms" className="underline hover:text-black transition-colors">
              Terms of service
            </a>
            <a href="#refund" className="underline hover:text-black transition-colors">
              Refund policy
            </a>
            <a href="#disclosure" className="underline hover:text-black transition-colors">
              Disclosure
            </a>
            <a href="mailto:support@bagrry.dev" className="underline hover:text-black transition-colors">
              Contact us
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400 text-[15px] font-roboto font-light">
          <span>© 2026 Bagrry Intelligence, Inc.</span>
          <span>16192 Coastal Highway, Lewes, Delaware 19958, USA</span>
        </div>
      </div>
    </footer>
  )
}
