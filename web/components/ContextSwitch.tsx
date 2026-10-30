'use client'

import React from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'

export function ContextSwitch() {
  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="rounded-[32px] border border-black/[0.08] bg-[#f7f7f7] p-8 sm:p-14 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 relative shadow-xs">
          <div className="max-w-lg text-left">
            <h2 className="text-[30px] sm:text-[36px] font-semibold text-black mb-3 tracking-tight leading-[1.2]">
              Chat with your meeting notes
            </h2>
            <p className="text-[18px] sm:text-[21px] text-neutral-600 mb-8 leading-[1.4] font-normal">
              Need to recall what was decided three weeks ago? Ask Bagrry to search across past meetings, synthesize decisions, and draft follow-ups in seconds.
            </p>

            <a href="/download">
              <button className="h-[54px] w-[250px] rounded-[10px] bg-black hover:bg-neutral-800 text-white font-medium text-[16px] transition-all flex items-center justify-center gap-3 shadow-md hover:scale-[1.01] active:scale-[0.99]">
                <Download className="w-5 h-5" />
                <span>Download for Mac</span>
              </button>
            </a>
          </div>

          {/* Decorative Sticker Graphic */}
          <div className="relative flex items-center justify-center">
            <Image
              src="/assets/img_17.png"
              alt="Context-switch sticker"
              width={260}
              height={260}
              className="object-contain drop-shadow-md hover:rotate-3 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
