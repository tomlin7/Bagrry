'use client'

import React, { useState } from 'react'
import { Download, Play } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export function Hero() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({ act_1: true, act_2: false })

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[32rem] w-[54rem] rounded-full bg-gradient-to-tr from-[#c3dd4f]/15 to-neutral-200/40 dark:from-[#c3dd4f]/10 dark:to-neutral-800/30 blur-[90px]" />
      </div>

      <div className="max-w-[1140px] mx-auto px-6 text-center">
        {/* Eyebrow Badge */}
        <div className="flex justify-center mb-6">
          <Badge variant="dot" className="px-4 py-1.5 text-xs font-medium gap-2">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">Native GPUIX Architecture</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-600 dark:text-neutral-400">Zero-latency & 100% on-device</span>
          </Badge>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 max-w-4xl mx-auto leading-[1.08] mb-6">
          AI meeting notes that{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400">
            close your open loops
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Bagrry captures your meeting context, links citations into verbatim transcripts, and extracts high-value action items automatically without bots joining your call.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-5">
          <a href="/download">
            <Button
              variant="dark"
              size="pill"
              className="w-full sm:w-auto gap-2.5 shadow-md hover:scale-[1.02] active:scale-[0.98] px-7"
            >
              <Download className="w-4 h-4" />
              <span>Download for Windows</span>
            </Button>
          </a>
          <a href="#demo">
            <Button
              variant="outline"
              size="pill"
              className="w-full sm:w-auto gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] px-6"
            >
              <Play className="w-3.5 h-3.5 text-neutral-500" />
              <span>Watch how it works</span>
            </Button>
          </a>
        </div>

        {/* Platform Support Subtext */}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-14">
          Windows 10/11 & macOS · Local SQLite store · Optional offline Whisper model
        </p>

        {/* Hero Interactive App Mockup Frame */}
        <div className="relative mx-auto max-w-5xl rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1a1a18] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden text-left">
          {/* Mockup Titlebar */}
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-neutral-50 dark:bg-[#222220] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
              <span className="ml-3 text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Q4 Product Roadmap & Native Architecture Sync · Bagrry
              </span>
            </div>

            {/* Floating Recording Pill on Window */}
            <div className="flex items-center gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full px-3 py-1 shadow-sm text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>04:18</span>
              <span className="text-neutral-400 text-[10px]">● REC</span>
            </div>
          </div>

          {/* Window Body Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            {/* Left Column: User Scratchpad Notes */}
            <div className="md:col-span-5 border-r border-black/[0.06] dark:border-white/[0.08] p-6 bg-white dark:bg-[#1c1c1a]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  User Scratchpad
                </span>
                <span className="text-xs text-neutral-400">Manual Notes</span>
              </div>
              <div className="space-y-3 text-sm text-neutral-800 dark:text-neutral-200 font-mono text-[13px] leading-relaxed">
                <p>• Agreed to transition to native GPUIX rendering engine for zero-latency dragging.</p>
                <p>• Verified Q4 release schedule: public beta late November.</p>
                <p>• Deploy standalone REST server with public web shares (/s/:token) and MCP protocol.</p>
                <p>• Alex to publish benchmark documentation by Friday.</p>
              </div>

              {/* Speaker Diarization Preview */}
              <div className="mt-8 pt-6 border-t border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-3">
                  Live Speaker Stream
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/60">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Host (Microphone)</span>
                    <span className="text-emerald-600 font-mono text-[10px]">Live · Speaking</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/30">
                    <span className="text-neutral-500">Attendees (WASAPI Loopback)</span>
                    <span className="text-neutral-400 font-mono text-[10px]">Listening</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: AI Enhanced Notes with Clickable Sentence Citations */}
            <div className="md:col-span-7 p-6 bg-neutral-50/70 dark:bg-[#20201e]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    AI Enhanced Summary
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#c3dd4f] text-[#1e2604]">
                    Synthesized
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  3 Citations Linked
                </div>
              </div>

              {/* Enhanced Content Sections */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7e9900] dark:text-[#c3dd4f] mb-2">
                    Executive Summary
                  </h4>
                  <div className="space-y-2.5 text-sm text-neutral-800 dark:text-neutral-200">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#282826] border border-black/[0.04] dark:border-white/[0.06] shadow-sm leading-relaxed">
                      <span>Agreed to transition from Webview architecture to native GPUIX rendering to eliminate memory overhead and achieve zero-latency window dragging.</span>
                      <span className="inline-block ml-2 px-1.5 py-0.5 rounded text-[11px] font-mono bg-[#c3dd4f]/25 text-[#4e6006] dark:text-[#c3dd4f] border border-[#c3dd4f]/50 cursor-pointer hover:bg-[#c3dd4f] hover:text-[#1e2604] transition-colors">
                        cite s_001
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#282826] border border-black/[0.04] dark:border-white/[0.06] shadow-sm leading-relaxed">
                      <span>Confirmed Q4 release timeline with public beta slated for late November.</span>
                      <span className="inline-block ml-2 px-1.5 py-0.5 rounded text-[11px] font-mono bg-[#c3dd4f]/25 text-[#4e6006] dark:text-[#c3dd4f] border border-[#c3dd4f]/50 cursor-pointer hover:bg-[#c3dd4f] hover:text-[#1e2604] transition-colors">
                        cite s_002
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next Steps & Action Items Strip */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7e9900] dark:text-[#c3dd4f] mb-2">
                    Extracted Action Items
                  </h4>
                  <div className="space-y-2">
                    <div
                      onClick={() => toggleCheck('act_1')}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#282826] border border-black/[0.04] dark:border-white/[0.06] cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#2e2e2b] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checkedItems.act_1)}
                        onChange={() => {}}
                        className="rounded text-neutral-900 focus:ring-0"
                      />
                      <span className={`text-xs ${checkedItems.act_1 ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        Deploy public web share endpoints and verify MCP JSON-RPC compatibility
                      </span>
                      <span className="ml-auto text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                        Alex
                      </span>
                    </div>

                    <div
                      onClick={() => toggleCheck('act_2')}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#282826] border border-black/[0.04] dark:border-white/[0.06] cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#2e2e2b] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checkedItems.act_2)}
                        onChange={() => {}}
                        className="rounded text-neutral-900 focus:ring-0"
                      />
                      <span className={`text-xs ${checkedItems.act_2 ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        Review benchmark performance numbers for GPU rendering
                      </span>
                      <span className="ml-auto text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                        Sarah
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
