'use client'

import React from 'react'

export function OwnYourMemory() {
  return (
    <section id="memory" className="py-20 md:py-28 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        {/* Left-aligned title and subtitle matching minimi */}
        <div className="max-w-xl mb-10 text-left">
          <h2 className="text-[36px] font-semibold tracking-tight text-black mb-3 font-roboto">
            Own your memory
          </h2>
          <p className="text-[21px] text-neutral-600 font-normal leading-[1.4] font-roboto">
            We take privacy very seriously. Your data remains yours only.
          </p>
        </div>

        {/* 2 Clean Grey Cards with NO borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Card 1: Stored on your PC */}
          <div className="p-8 sm:p-10 rounded-[24px] bg-[#f2f2f2] flex flex-col justify-between">
            <div>
              {/* Clean Laptop Outline Icon matching minimi */}
              <div className="mb-6">
                <svg
                  className="w-8 h-8 text-black stroke-[1.75]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect x="3" y="4" width="18" height="12" rx="2" />
                  <path d="M2 20h20" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-black mb-2 tracking-tight font-roboto">
                Stored on your PC
              </h3>
              <p className="text-[18px] text-neutral-600 leading-relaxed font-normal font-roboto">
                Your memory is stored on your device.
              </p>
            </div>
          </div>

          {/* Card 2: No cloud database */}
          <div className="p-8 sm:p-10 rounded-[24px] bg-[#f2f2f2] flex flex-col justify-between">
            <div>
              {/* Clean Lock Outline Icon matching minimi */}
              <div className="mb-6">
                <svg
                  className="w-8 h-8 text-black stroke-[1.75]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <circle cx="12" cy="16" r="1.5" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-black mb-2 tracking-tight font-roboto">
                No cloud database
              </h3>
              <p className="text-[18px] text-neutral-600 leading-relaxed font-normal font-roboto">
                None of your data is stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
