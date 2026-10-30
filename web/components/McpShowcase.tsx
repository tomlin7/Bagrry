'use client'

import React from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

export function McpShowcase() {
  return (
    <section id="enhance" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[34px] sm:text-[42px] font-semibold tracking-tight text-black">
            How does it work?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Model Context Protocol */}
          <div className="rounded-[28px] border border-black/[0.08] bg-[#f7f7f7] p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-xs hover:border-black/[0.15] transition-all">
            <div>
              <h3 className="text-[26px] sm:text-[30px] font-semibold text-black mb-3 tracking-tight">
                Model Context Protocol (MCP)
              </h3>
              <p className="text-[16px] sm:text-[18px] text-neutral-600 mb-8 leading-relaxed font-normal">
                Exposes your meeting knowledge to Claude Desktop, Cursor, and AI agents via local JSON-RPC on port 47821. Never re-explain past decisions to AI again.
              </p>

              <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-xs mb-8">
                <Image
                  src="/assets/img_18.png"
                  alt="Model Context Protocol"
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

          {/* Card 2: Templates & Recipes */}
          <div className="rounded-[28px] border border-black/[0.08] bg-[#f7f7f7] p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-xs hover:border-black/[0.15] transition-all relative">
            <div>
              <h3 className="text-[26px] sm:text-[30px] font-semibold text-black mb-3 tracking-tight">
                Templates & Recipes
              </h3>
              <p className="text-[16px] sm:text-[18px] text-neutral-600 mb-8 leading-relaxed font-normal">
                Apply tailored formats for 1:1s, sales discovery, sprint syncs, or run 1-click recipes to draft follow-up emails in your exact voice.
              </p>

              <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-xs mb-8">
                <Image
                  src="/assets/img_19.png"
                  alt="Templates and Recipes"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Handwritten annotation badge matching projectminimi */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-serif italic font-bold shadow-xs">
                ⚡ 1-click follow-up recipes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
