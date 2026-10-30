'use client'

import React from 'react'
import Image from 'next/image'

export function ContextSwitch() {
  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Heading, Subtitle, Download for Windows */}
          <div className="md:col-span-7 text-left">
            <h2 className="text-[36px] font-semibold text-black mb-3 tracking-tight leading-[1.2] font-roboto">
              Context-switch like a Pro
            </h2>
            <p className="text-[21px] text-neutral-600 mb-8 leading-[1.4] font-normal font-roboto max-w-lg">
              Bagrry never misses what should be on your plate.
            </p>

            <a href="/download">
              <button className="h-[54px] px-8 rounded-[9px] bg-black hover:bg-neutral-800 text-white font-medium text-[19px] transition-all flex items-center justify-center gap-3 shadow-none cursor-pointer">
                {/* Windows Icon */}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 88 88">
                  <path d="M0 12.402l35.687-4.86.016 34.423-35.67.243zm35.67 33.529l.028 34.453L.028 75.48.016 45.7zm4.326-39.027L87.914 0v41.527l-47.918.375zm47.918 45.023L40.024 88l-.028-34.195 47.918.303z"/>
                </svg>
                <span>Download for Windows</span>
              </button>
            </a>
          </div>

          {/* Right Column: Floating Cat Sticker Graphic on White */}
          <div className="md:col-span-5 flex items-center justify-center md:justify-end">
            <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px]">
              <Image
                src="/assets/img_17.png"
                alt="Context switch cat sticker"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
