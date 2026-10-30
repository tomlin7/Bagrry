'use client'

import React from 'react'
import { HardDrive, EyeOff } from 'lucide-react'

export function OwnYourMemory() {
  return (
    <section id="privacy" className="py-16 bg-white">
      <div className="max-w-[1024px] mx-auto px-6">
        <div className="rounded-[32px] bg-[#1c1c1c] text-white p-8 sm:p-14 md:p-16 relative overflow-hidden">
          {/* Subtle background radial pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="relative z-10 max-w-xl mb-12 text-left">
            <h2 className="text-[34px] sm:text-[42px] font-semibold tracking-tight text-white mb-3">
              Your notes stay yours
            </h2>
            <p className="text-[17px] sm:text-[19px] text-neutral-400 font-normal leading-relaxed">
              We take privacy seriously. Your audio recordings, transcripts, and enhanced notes remain strictly on your machine.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pillar 1: Stored on your device */}
            <div className="p-8 rounded-[24px] bg-[#242424] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-white">
                  <HardDrive className="w-6 h-6 text-neutral-200" />
                </div>
                <h3 className="text-[22px] font-semibold text-white mb-2 tracking-tight">
                  Stored on your device
                </h3>
                <p className="text-[15px] text-neutral-400 leading-relaxed font-normal">
                  All notes, citations, and scratchpads are saved locally in high-speed SQLite with WAL mode. Complete data ownership.
                </p>
              </div>
            </div>

            {/* Pillar 2: Zero meeting bots */}
            <div className="p-8 rounded-[24px] bg-[#242424] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-white">
                  <EyeOff className="w-6 h-6 text-neutral-200" />
                </div>
                <h3 className="text-[22px] font-semibold text-white mb-2 tracking-tight">
                  Zero meeting bots
                </h3>
                <p className="text-[15px] text-neutral-400 leading-relaxed font-normal">
                  No awkward recording bots joining your calls, no screen recording telemetry, and zero model training on your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
