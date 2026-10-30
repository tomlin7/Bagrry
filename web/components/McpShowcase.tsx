'use client'

import React from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

export function McpShowcase() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        {/* Left-aligned title matching minimi */}
        <div className="mb-12 text-left">
          <h2 className="text-[36px] font-semibold tracking-tight text-black font-roboto">
            How does it work?
          </h2>
        </div>

        {/* 2-Column Grid with NO outer border boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Column 1: Model Context Protocol */}
          <div className="flex flex-col text-left">
            <div className="relative w-full aspect-square rounded-[26px] overflow-hidden mb-6">
              <Image
                src="/assets/img_18.png"
                alt="Model Context Protocol"
                fill
                className="object-cover"
              />
            </div>

            <h3 className="text-[26px] font-semibold text-black mb-2 tracking-tight font-roboto">
              Model Context Protocol (MCP)
            </h3>
            <p className="text-[18px] text-neutral-600 mb-6 leading-relaxed font-normal font-roboto">
              Exposes your meeting knowledge to Claude Desktop, Cursor, and AI agents via local JSON-RPC on port 47821. Never re-explain past decisions to AI again.
            </p>

            <div>
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f2f2f2] hover:bg-neutral-200 text-black text-[15px] font-medium transition-all"
              >
                <span>Check out MCP</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Open loops Inbox */}
          <div className="flex flex-col text-left">
            <div className="relative w-full aspect-square rounded-[26px] overflow-hidden mb-6">
              <Image
                src="/assets/img_19.png"
                alt="Open loops Inbox"
                fill
                className="object-cover"
              />
            </div>

            <h3 className="text-[26px] font-semibold text-black mb-2 tracking-tight font-roboto">
              Open loops Inbox
            </h3>
            <p className="text-[18px] text-neutral-600 mb-6 leading-relaxed font-normal font-roboto">
              Aggregates every commitment across all calls into &apos;Owed by Me&apos; and &apos;Owed to Me&apos; so nothing slips through the cracks.
            </p>

            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-100 text-amber-900 text-[14px] font-serif italic font-bold">
                ✏️ You are here right now
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
