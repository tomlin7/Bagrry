import React from 'react'
import { HardDrive, EyeOff, Cpu } from 'lucide-react'

export function OwnYourMemory() {
  return (
    <section id="privacy" className="py-24 bg-neutral-900 text-white relative overflow-hidden rounded-[2.5rem] mx-4 sm:mx-6 my-12">
      {/* Subtle background mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-[1100px] mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c3dd4f] block mb-3">
            Local-First Confidentiality
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Own your memory
          </h2>
          <p className="text-neutral-400 text-base md:text-lg leading-relaxed">
            We take privacy very seriously. Your meeting context, voice recordings, and notes remain strictly yours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Stored on your device */}
          <div className="p-8 rounded-3xl bg-[#1c1c1a] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <HardDrive className="w-6 h-6 text-[#c3dd4f]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Stored on your device</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                All meeting notes, citations, and action items are saved locally in a high-speed SQLite database with WAL mode.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 text-xs font-mono text-neutral-500">
              100% offline accessible
            </div>
          </div>

          {/* Card 2: No cloud database */}
          <div className="p-8 rounded-3xl bg-[#1c1c1a] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <EyeOff className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No cloud database</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                None of your private data is stored on remote servers. We don&apos;t train on your data, retain logs, or resell it.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 text-xs font-mono text-neutral-500">
              Zero telemetry tracking
            </div>
          </div>

          {/* Card 3: Offline Whisper STT */}
          <div className="p-8 rounded-3xl bg-[#1c1c1a] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Offline Whisper Engine</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Run OpenAI&apos;s Whisper model locally on your Ryzen CPU using AVX2 or Vulkan with zero internet connectivity.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 text-xs font-mono text-neutral-500">
              Hardware accelerated
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
