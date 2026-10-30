'use client'

import React from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'

export function CtaBanner() {
  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden text-center">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="rounded-[32px] border border-black/[0.08] bg-[#f7f7f7] p-10 sm:p-16 md:p-20 relative overflow-hidden flex flex-col items-center shadow-xs">
          <h2 className="text-[34px] sm:text-[44px] md:text-[48px] font-semibold tracking-tight text-black mb-4 leading-[1.15]">
            Never leave a meeting with loose ends
          </h2>
          <p className="text-[18px] sm:text-[21px] text-neutral-600 mb-10 max-w-md font-normal">
            No awkward meeting bots. No unreadable transcripts. Take rough notes, enhance with AI, and verify every citation.
          </p>

          <a href="/download">
            <button className="h-[54px] w-[250px] rounded-[10px] bg-black hover:bg-neutral-800 text-white font-medium text-[16px] transition-all flex items-center justify-center gap-3 shadow-md hover:scale-[1.01] active:scale-[0.99] mb-8">
              <Download className="w-5 h-5" />
              <span>Download for Mac</span>
            </button>
          </a>

          {/* Decorative illustration sticker matching projectminimi */}
          <div className="relative mt-2">
            <Image
              src="/assets/img_20.png"
              alt="Stay on top of your work sticker"
              width={160}
              height={120}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
