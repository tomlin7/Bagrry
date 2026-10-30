'use client'

import React from 'react'
import Image from 'next/image'

export function CtaBanner() {
  return (
    <section className="py-24 md:py-32 bg-white text-center">
      <div className="max-w-[1024px] mx-auto px-6 flex flex-col items-center">
        <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-tight text-black mb-3 leading-[1.2] font-roboto">
          Stay on top of your work
        </h2>
        <p className="text-[21px] text-neutral-600 mb-8 max-w-md font-normal font-roboto">
          No setup needed. Just download and begin.
        </p>

        <a href="/download">
          <button className="h-[54px] px-8 rounded-[9px] bg-black hover:bg-neutral-800 text-white font-medium text-[19px] transition-all flex items-center justify-center gap-3 cursor-pointer mb-12">
            {/* Windows Icon */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 88 88">
              <path d="M0 12.402l35.687-4.86.016 34.423-35.67.243zm35.67 33.529l.028 34.453L.028 75.48.016 45.7zm4.326-39.027L87.914 0v41.527l-47.918.375zm47.918 45.023L40.024 88l-.028-34.195 47.918.303z"/>
            </svg>
            <span>Download for Windows</span>
          </button>
        </a>

        {/* Decorative Cat Sticker Graphic */}
        <div className="relative w-[180px] h-[140px]">
          <Image
            src="/assets/img_20.png"
            alt="Stay on top sticker"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </section>
  )
}
