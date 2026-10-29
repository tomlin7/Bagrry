'use client'

import React, { useState } from 'react'
import { Download, Laptop, Apple, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DownloadPage() {
  const [platform, setPlatform] = useState<'windows' | 'mac'>('windows')

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between antialiased">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-36 pb-24 text-center">
        <div className="flex justify-center mb-6">
          <Badge variant="dot" className="px-4 py-1.5 text-xs font-medium">
            Release v1.0.0 · Native GPUIX Desktop Engine
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
          Download Bagrry
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed">
          The high-performance AI meeting notepad. Runs natively on your GPU with zero-latency window dragging and 100% on-device confidentiality.
        </p>

        {/* Platform Switcher Pills */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 border border-black/[0.05] dark:border-white/[0.05]">
            <button
              onClick={() => setPlatform('windows')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                platform === 'windows'
                  ? 'bg-white dark:bg-[#1c1c1c] text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Windows</span>
            </button>
            <button
              onClick={() => setPlatform('mac')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                platform === 'mac'
                  ? 'bg-white dark:bg-[#1c1c1c] text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>macOS</span>
            </button>
          </div>
        </div>

        {/* Main Installer Card */}
        <Card className="max-w-xl mx-auto p-8 sm:p-10 shadow-lg text-left mb-12">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {platform === 'windows' ? 'Bagrry for Windows 10 & 11' : 'Bagrry for macOS (Apple Silicon & Intel)'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Version 1.0.0 (x64 / arm64) · 48.2 MB
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#c3dd4f]/20 border border-[#c3dd4f]/40 flex items-center justify-center text-[#4e6006] dark:text-[#c3dd4f]">
              <Download className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-3 mb-8 text-sm text-neutral-700 dark:text-neutral-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Native GPUIX rendering with instant Aero Snap & titlebar window dragging</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Dual-channel WASAPI / CoreAudio loopback capture (no meeting bots)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Local SQLite WAL store and integrated Memory MCP server (port 47821)</span>
            </div>
          </div>

          <a href="#" download className="block">
            <Button variant="accent" size="lg" className="w-full gap-2 rounded-2xl shadow-md text-sm font-semibold">
              <Download className="w-4 h-4" />
              <span>{platform === 'windows' ? 'Download Installer (.exe)' : 'Download Disk Image (.dmg)'}</span>
            </Button>
          </a>

          <p className="text-center text-[11px] text-neutral-400 mt-4">
            SHA-256 verified build · Zero telemetry
          </p>
        </Card>

        {/* Quick Developer Build alternative */}
        <div className="max-w-xl mx-auto text-left p-6 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-black/[0.05] dark:border-white/[0.05]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            Developer / Local Build
          </h4>
          <div className="p-3 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-xs overflow-x-auto">
            <p className="text-neutral-500">{`# Run native GPUIX desktop app:`}</p>
            <p className="text-emerald-400">{`cd desktop/gpuix && bun run dev`}</p>
            <p className="text-neutral-500 mt-2">{`# Start local REST daemon & MCP server:`}</p>
            <p className="text-emerald-400">{`cd server && bun run start`}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
