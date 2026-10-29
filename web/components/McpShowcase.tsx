'use client'

import React from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

export function McpShowcase() {
  return (
    <section id="memory" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[34px] sm:text-[42px] font-semibold tracking-tight text-black">
            How does it work?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Memory MCP */}
          <div className="rounded-[28px] border border-black/[0.08] bg-[#f7f7f7] p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-xs hover:border-black/[0.15] transition-all">
            <div>
              <h3 className="text-[26px] sm:text-[30px] font-semibold text-black mb-3 tracking-tight">
                Memory MCP
              </h3>
              <p className="text-[16px] sm:text-[18px] text-neutral-600 mb-8 leading-relaxed font-normal">
                Captures your personal context so you never explain yourself to AI again.
              </p>

              <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-xs mb-8">
                <Image
                  src="/assets/img_18.png"
                  alt="Memory MCP"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            <div>
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/[0.15] bg-white hover:bg-neutral-50 text-neutral-900 text-sm font-medium transition-all shadow-xs"
              >
                <span>Check out MCP</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Open loops Inbox */}
          <div className="rounded-[28px] border border-black/[0.08] bg-[#f7f7f7] p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-xs hover:border-black/[0.15] transition-all relative">
            <div>
              <h3 className="text-[26px] sm:text-[30px] font-semibold text-black mb-3 tracking-tight">
                Open loops Inbox
              </h3>
              <p className="text-[16px] sm:text-[18px] text-neutral-600 mb-8 leading-relaxed font-normal">
                Uses your personal context and never lets you miss your commitments.
              </p>

              <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-xs mb-8">
                <Image
                  src="/assets/img_19.png"
                  alt="Open loops Inbox"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Handwritten annotation badge matching projectminimi */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-serif italic font-bold shadow-xs">
                ✏️ You are here right now
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
