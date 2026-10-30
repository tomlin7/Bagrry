'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Download, Monitor } from 'lucide-react'

export function Hero() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    act_1: true,
    act_2: false,
  })

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section className="relative pt-[150px] md:pt-[180px] pb-16 overflow-hidden bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline, Subtitle, CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Main Headline matching product identity */}
            <h1 className="text-[34px] sm:text-[42px] font-semibold leading-[1.1] tracking-tight text-black mb-6">
              The AI notepad for{' '}
              <span className="text-[#ff8133] inline-block font-semibold">
                people in back-to-back
              </span>{' '}
              meetings
            </h1>

            {/* Subtitle matching product identity */}
            <p className="text-[18px] sm:text-[21px] leading-[1.4] text-neutral-600 max-w-[500px] mb-8 font-normal">
              Take rough notes during your calls. Bagrry listens without bots, enhancing your shorthand into structured recaps with verified citations.
            </p>

            {/* CTA Download Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <a href="/download">
                <button className="h-[54px] w-[250px] rounded-[10px] bg-black hover:bg-neutral-800 text-white font-medium text-[16px] transition-all flex items-center justify-center gap-3 shadow-md hover:scale-[1.01] active:scale-[0.99]">
                  <Download className="w-5 h-5" />
                  <span>Download for Mac</span>
                </button>
              </a>

              <a href="/download" className="text-xs text-neutral-400 hover:text-black flex items-center gap-1.5 transition-colors pl-1">
                <Monitor className="w-3.5 h-3.5" />
                <span>Also available for Windows 10/11</span>
              </a>
            </div>

            <p className="text-[13px] text-neutral-400 font-mono">
              Zero meeting bots · Verbatim citations · Local SQLite storage
            </p>
          </div>

          {/* Right Column: Hero Graphic / Interactive App Preview */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[420px] rounded-2xl border border-black/[0.08] bg-[#fafaf8] p-4 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  <span className="text-[11px] font-medium text-neutral-500 ml-2">
                    Bagrry · Product Strategy Sync
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>04:18 REC</span>
                </div>
              </div>

              {/* Note Content Preview */}
              <div className="space-y-3 text-left">
                <div className="p-3 rounded-xl bg-white border border-black/[0.05] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    AI Enhanced Summary
                  </span>
                  <div
                    onClick={() => toggleCheck('act_1')}
                    className="flex items-start gap-2.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedItems.act_1)}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-black focus:ring-0"
                    />
                    <div>
                      <p className={`text-xs font-medium ${checkedItems.act_1 ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                        Migrate local storage to SQLite WAL mode for sub-millisecond offline note retrieval
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#c3dd4f]/20 text-[#4c5c06] border border-[#c3dd4f]/40">
                        cite s_014 · 12:40
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-black/[0.05] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Action Item
                  </span>
                  <div
                    onClick={() => toggleCheck('act_2')}
                    className="flex items-start gap-2.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedItems.act_2)}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-black focus:ring-0"
                    />
                    <div>
                      <p className={`text-xs font-medium ${checkedItems.act_2 ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                        Draft revised API schema and share with engineering team by Friday
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#c3dd4f]/20 text-[#4c5c06] border border-[#c3dd4f]/40">
                        cite s_028 · 24:15
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Decorative Cat/Notepad Sticker */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 pointer-events-none opacity-90">
                <Image
                  src="/assets/img_17.png"
                  alt="Sticker"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
