'use client'

import React from 'react'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative pt-12 md:pt-16 pb-16 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline, Subtitle, CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <h1 className="text-[42px] sm:text-[48px] font-semibold leading-[1.15] tracking-tight text-black mb-6 font-roboto">
              AI notepad that{' '}
              <span className="text-[#ff8133] inline-block font-semibold">
                closes
              </span>{' '}
              your
              <br />
              open loops in meetings
            </h1>

            <p className="text-[21px] leading-[1.4] text-neutral-600 max-w-[480px] mb-8 font-normal font-roboto">
              Bagrry captures your meeting context and never lets you miss your commitments.
            </p>

            {/* Primary CTA Button for Windows */}
            <div className="flex items-center gap-4">
              <a href="/download">
                <button className="h-[54px] px-8 rounded-[9px] bg-black hover:bg-neutral-800 text-white font-medium text-[19px] transition-all flex items-center justify-center gap-3 cursor-pointer">
                  {/* Clean Windows Icon */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 88 88">
                    <path d="M0 12.402l35.687-4.86.016 34.423-35.67.243zm35.67 33.529l.028 34.453L.028 75.48.016 45.7zm4.326-39.027L87.914 0v41.527l-47.918.375zm47.918 45.023L40.024 88l-.028-34.195 47.918.303z"/>
                  </svg>
                  <span>Download for Windows</span>
                </button>
              </a>
            </div>
          </div>

          {/* Right Column: Floating Cat Sticker Graphic */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-[340px] h-[296px] sm:w-[380px] sm:h-[330px]">
              <Image
                src="/assets/img_01.png"
                alt="Bagrry illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
