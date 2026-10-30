'use client'

import React from 'react'
import Image from 'next/image'

export function WorksLikeMagic() {
  return (
    <section id="works-like-magic" className="py-20 md:py-28 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        {/* Section Heading matching minimi: Left-aligned, 36px font-semibold */}
        <div className="mb-12">
          <h2 className="text-[36px] font-semibold tracking-tight text-black font-roboto">
            Works like magic
          </h2>
        </div>

        {/* 2-Column Headers: Step 1 and Step 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
          {/* Step 1 Column */}
          <div className="flex flex-col items-start text-left">
            <span className="text-[60px] font-semibold text-[#e3e3e3] leading-[0.7em] mb-4 font-roboto">
              1.
            </span>
            <h3 className="text-[30px] font-semibold text-black mb-3 tracking-tight font-roboto">
              Bagrry finds your open loops
            </h3>
            <p className="text-[21px] text-neutral-600 leading-[1.4] font-normal font-roboto">
              Captures your meeting context and finds your high-value action-items.
            </p>
          </div>

          {/* Step 2 Column */}
          <div className="flex flex-col items-start text-left">
            <span className="text-[60px] font-semibold text-[#e3e3e3] leading-[0.7em] mb-4 font-roboto">
              2.
            </span>
            <h3 className="text-[30px] font-semibold text-black mb-3 tracking-tight font-roboto">
              then closes them automatically
            </h3>
            <p className="text-[21px] text-neutral-600 leading-[1.4] font-normal font-roboto">
              Traces your decisions, and resolves closed loops without manual effort.
            </p>
          </div>
        </div>

        {/* Combined Step 1 & Step 2 Visual Graphic (img_11.png from minimi) */}
        <div className="relative w-full aspect-[2048/1248] rounded-[26px] overflow-hidden mb-24">
          <Image
            src="/assets/img_11.png"
            alt="Works like magic preview"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Supports all meeting apps */}
        <div className="text-left max-w-2xl">
          <h3 className="text-[36px] font-semibold text-black mb-3 tracking-tight font-roboto">
            Supports all meeting apps
          </h3>
          <p className="text-[21px] text-neutral-600 leading-[1.4] font-normal font-roboto mb-8">
            Bagrry works right out of the box without the need for any integration.
          </p>

          {/* App Pill Badges with clean neutral style */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 bg-[#f2f2f2] px-5 py-3 rounded-2xl">
              <Image
                src="/assets/img_13.png"
                alt="WhatsApp"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
              <span className="text-[18px] font-normal text-black font-roboto">WhatsApp</span>
            </div>

            <div className="flex items-center gap-3 bg-[#f2f2f2] px-5 py-3 rounded-2xl">
              <Image
                src="/assets/img_14.png"
                alt="Gmail"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
              <span className="text-[18px] font-normal text-black font-roboto">Gmail</span>
            </div>

            <div className="flex items-center gap-3 bg-[#f2f2f2] px-5 py-3 rounded-2xl">
              <Image
                src="/assets/img_15.png"
                alt="Calendar"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
              <span className="text-[18px] font-normal text-black font-roboto">Calendar</span>
            </div>

            <div className="flex items-center bg-[#f2f2f2] px-5 py-3 rounded-2xl">
              <span className="text-[18px] font-normal text-neutral-500 font-roboto">and more…</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
