'use client'

import React from 'react'
import Image from 'next/image'

export function WorksLikeMagic() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        {/* Section Heading matching projectminimi */}
        <div className="text-center mb-16">
          <h2 className="text-[34px] sm:text-[42px] font-semibold tracking-tight text-black">
            Works like magic
          </h2>
        </div>

        {/* 3 Bento Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Card 1: You write raw thoughts */}
          <div className="md:col-span-6 rounded-[28px] border border-black/[0.08] bg-[#f7f7f7] p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-xs hover:border-black/[0.15] transition-all">
            <div className="mb-8">
              <span className="text-[36px] sm:text-[42px] font-semibold text-neutral-400 block mb-2 leading-none">
                1.
              </span>
              <h3 className="text-[24px] sm:text-[28px] font-semibold text-black mb-3 tracking-tight">
                You write raw thoughts
              </h3>
              <p className="text-[16px] sm:text-[18px] text-neutral-600 leading-relaxed font-normal">
                Take rapid, distraction-free notes during your call. Jot down shorthand bullets, key decisions, and whatever caught your attention.
              </p>
            </div>

            {/* High-res Step 1 Screenshot */}
            <div className="h-[280px] w-full rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-xs relative">
              <Image
                src="/assets/img_11.png"
                alt="You write raw thoughts"
                fill
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Card 2: Bagrry enhances with transcript */}
          <div className="md:col-span-6 rounded-[28px] border border-black/[0.08] bg-[#f7f7f7] p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-xs hover:border-black/[0.15] transition-all">
            <div className="mb-8">
              <span className="text-[36px] sm:text-[42px] font-semibold text-neutral-400 block mb-2 leading-none">
                2.
              </span>
              <h3 className="text-[24px] sm:text-[28px] font-semibold text-black mb-3 tracking-tight">
                Bagrry enhances with transcript
              </h3>
              <p className="text-[16px] sm:text-[18px] text-neutral-600 leading-relaxed font-normal">
                Post-meeting, Bagrry merges your human emphasis with verbatim audio, producing structured takeaways with clickable sentence citations.
              </p>
            </div>

            {/* High-res Step 2 Screenshot */}
            <div className="h-[280px] w-full rounded-2xl border border-black/[0.06] bg-white overflow-hidden shadow-xs relative">
              <Image
                src="/assets/img_12.png"
                alt="Bagrry enhances with transcript"
                fill
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Card 3: Supports all apps (Full Width) */}
          <div className="md:col-span-12 rounded-[28px] border border-black/[0.08] bg-[#f7f7f7] p-8 md:p-12 overflow-hidden shadow-xs hover:border-black/[0.15] transition-all">
            <div className="max-w-xl mb-10">
              <h3 className="text-[26px] sm:text-[32px] font-semibold text-black mb-3 tracking-tight">
                Works with all meeting platforms
              </h3>
              <p className="text-[16px] sm:text-[18px] text-neutral-600 leading-relaxed font-normal">
                Bagrry captures audio directly through native OS loopback. No awkward bots joining your Zoom, Google Meet, Teams, or Slack calls.
              </p>
            </div>

            {/* App Icons Row matching projectminimi */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-10">
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-black/[0.06] shadow-xs">
                <Image
                  src="/assets/img_13.png"
                  alt="WhatsApp"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-sm font-medium text-neutral-800">WhatsApp</span>
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-black/[0.06] shadow-xs">
                <Image
                  src="/assets/img_14.png"
                  alt="Gmail"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-sm font-medium text-neutral-800">Gmail</span>
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-black/[0.06] shadow-xs">
                <Image
                  src="/assets/img_15.png"
                  alt="Calendar"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-sm font-medium text-neutral-800">Calendar</span>
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-black/[0.06] shadow-xs">
                <span className="text-sm font-medium text-neutral-500">and more…</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
