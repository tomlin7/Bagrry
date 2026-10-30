'use client'

import React from 'react'
import Link from 'next/link'

export function Navbar() {
  return (
    <header className="w-full bg-white">
      <nav className="max-w-[1024px] mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm tracking-tighter">
            B
          </div>
          <span className="font-bold text-[22px] tracking-tight text-black font-roboto">
            Bagrry
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-8 text-[18px] font-normal text-[#999999] font-roboto">
          <a href="#about" className="hover:text-black transition-colors">
            About
          </a>
          <a href="#memory" className="hover:text-black transition-colors">
            Memory
          </a>
        </div>
      </nav>
    </header>
  )
}
