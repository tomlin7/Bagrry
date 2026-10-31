'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Play,
  Pause,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Download,
  Bot,
  Copy,
  Check,
} from 'lucide-react'

type TemplateKey = 'executive' | 'architecture' | 'discovery'

interface CitationData {
  id: number
  speaker: string
  time: string
  quote: string
}

const CITATIONS: Record<number, CitationData> = {
  1: {
    id: 1,
    speaker: 'Alex Chen (VP Engineering)',
    time: '00:14',
    quote: 'Our primary objective is reducing end-to-end sync latency below 40ms before Q4 rollout.',
  },
  2: {
    id: 2,
    speaker: 'You (Host Microphone)',
    time: '00:32',
    quote: 'We will use native WASAPI loopback capture to record system audio without meeting bots.',
  },
  3: {
    id: 3,
    speaker: 'Sarah Lin (Product Lead)',
    time: '01:05',
    quote: 'I will log the ticket in Linear and sync the Obsidian vault export by Friday afternoon.',
  },
}

export function InteractiveSandbox() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>('executive')
  const [activeCitation, setActiveCitation] = useState<number | null>(1)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [copiedNote, setCopiedNote] = useState(false)
  const [hudOpen, setHudOpen] = useState(false)
  const [userScratchpad, setUserScratchpad] = useState(
    '- Met with Alex and Sarah regarding WASAPI pipeline\n- Target Q4 latency target: <40ms\n- Push native Obsidian export to production'
  )

  const handleCopy = () => {
    setCopiedNote(true)
    setTimeout(() => setCopiedNote(false), 2000)
  }

  return (
    <section id="interactive-demo" className="py-20 bg-neutral-900 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#ff8133]/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-[1180px] mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[12px] font-mono font-medium text-[#ff8133] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Product Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Try Bagrry directly in your browser
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
            Click citation pills, test speaker turn attribution, and experience the dual-pane notepad before installing on Windows.
          </p>
        </div>

        {/* Sandbox Window Frame */}
        <div className="rounded-2xl border border-white/15 bg-neutral-950 shadow-2xl overflow-hidden">
          {/* Mock Window Titlebar */}
          <div className="h-11 bg-neutral-900/90 border-b border-white/10 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-3 font-mono text-xs text-neutral-400 font-medium">
                Bagrry · Q4 Product Architecture Sync
              </span>
            </div>

            {/* Template Selector Pills */}
            <div className="hidden sm:flex items-center gap-1.5 bg-neutral-800/80 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setActiveTemplate('executive')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTemplate === 'executive'
                    ? 'bg-[#ff8133] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Executive Brief
              </button>
              <button
                onClick={() => setActiveTemplate('architecture')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTemplate === 'architecture'
                    ? 'bg-[#ff8133] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sprint Architecture
              </button>
              <button
                onClick={() => setActiveTemplate('discovery')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTemplate === 'discovery'
                    ? 'bg-[#ff8133] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sales Discovery
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHudOpen(!hudOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
                  hudOpen
                    ? 'bg-[#ff8133]/20 border-[#ff8133] text-[#ff8133]'
                    : 'bg-neutral-800 border-white/10 text-neutral-300 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{hudOpen ? 'Close HUD' : 'Float HUD'}</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs border border-white/10 transition-colors"
              >
                {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNote ? 'Copied' : 'Export'}</span>
              </button>
            </div>
          </div>

          {/* Dual-Pane Content Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-[460px] text-sm">
            {/* Left Pane: Verbatim Stream & Scratchpad */}
            <div className="p-5 flex flex-col justify-between bg-neutral-950/60">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="flex size-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-mono text-xs font-semibold uppercase text-red-400">
                      Live WASAPI Loopback
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400">00:45:12 recorded</span>
                </div>

                {/* Speaker Diarization Stream */}
                <div className="space-y-3 font-sans text-[13px]">
                  <div
                    onClick={() => setActiveCitation(1)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeCitation === 1
                        ? 'bg-[#ff8133]/15 border-[#ff8133]/50'
                        : 'bg-neutral-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pb-1">
                      <span className="text-[#ff8133] font-medium">Alex Chen (VP Engineering)</span>
                      <span>00:14</span>
                    </div>
                    <p className="text-neutral-200 leading-snug">
                      &quot;Our target is reducing end-to-end sync latency below 40ms before Q4 rollout.&quot;
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveCitation(2)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeCitation === 2
                        ? 'bg-[#ff8133]/15 border-[#ff8133]/50'
                        : 'bg-neutral-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pb-1">
                      <span className="text-emerald-400 font-medium">You (Host Microphone)</span>
                      <span>00:32</span>
                    </div>
                    <p className="text-neutral-200 leading-snug">
                      &quot;We will use native WASAPI loopback capture to record system audio without meeting bots.&quot;
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveCitation(3)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeCitation === 3
                        ? 'bg-[#ff8133]/15 border-[#ff8133]/50'
                        : 'bg-neutral-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pb-1">
                      <span className="text-purple-400 font-medium">Sarah Lin (Product Lead)</span>
                      <span>01:05</span>
                    </div>
                    <p className="text-neutral-200 leading-snug">
                      &quot;I will log the ticket in Linear and sync the Obsidian vault export by Friday afternoon.&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Scratchpad Area */}
              <div className="pt-4 mt-4 border-t border-white/10">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                  Your Scratchpad Notes (Auto-saved)
                </label>
                <textarea
                  rows={3}
                  value={userScratchpad}
                  onChange={(e) => setUserScratchpad(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-neutral-200 font-mono focus:border-[#ff8133] focus:outline-none resize-none"
                  placeholder="Type any quick thoughts during the call..."
                />
              </div>
            </div>

            {/* Right Pane: AI Enhanced Briefing with Sentence Citations */}
            <div className="p-5 flex flex-col justify-between bg-neutral-900/40 relative">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff8133]" />
                    <span>AI-Enhanced Summary & Commitments</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                    High Confidence (3 Citations)
                  </span>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-neutral-300">
                  <div>
                    <h4 className="font-semibold text-white text-[13px] mb-1">
                      1. Strategic Latency Targets
                    </h4>
                    <p>
                      Engineering is committed to delivering sub-40ms end-to-end sync latency for real-time collaboration before Q4{' '}
                      <button
                        onClick={() => setActiveCitation(1)}
                        className="inline-flex items-center justify-center px-1.5 py-0.2 mx-1 rounded bg-[#ff8133]/20 border border-[#ff8133] text-[#ff8133] font-mono text-[10px] font-bold hover:scale-105 transition-transform"
                      >
                        [1]
                      </button>
                      . This unblocks high-frequency audio synthesis without cloud roundtrips.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white text-[13px] mb-1">
                      2. Bot-Free Local Architecture
                    </h4>
                    <p>
                      The app uses Windows WASAPI loopback audio capture directly from user hardware{' '}
                      <button
                        onClick={() => setActiveCitation(2)}
                        className="inline-flex items-center justify-center px-1.5 py-0.2 mx-1 rounded bg-[#ff8133]/20 border border-[#ff8133] text-[#ff8133] font-mono text-[10px] font-bold hover:scale-105 transition-transform"
                      >
                        [2]
                      </button>
                      , preventing intrusive external meeting bots from joining calls.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white text-[13px] mb-1">
                      3. Action Items & Commitments
                    </h4>
                    <ul className="space-y-1.5 pt-1">
                      <li className="flex items-center gap-2 text-neutral-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Sarah Lin: Log Linear engineering ticket and Obsidian vault sync{' '}</span>
                        <button
                          onClick={() => setActiveCitation(3)}
                          className="inline-flex items-center justify-center px-1.5 py-0.2 rounded bg-[#ff8133]/20 border border-[#ff8133] text-[#ff8133] font-mono text-[10px] font-bold"
                        >
                          [3]
                        </button>
                      </li>
                      <li className="flex items-center gap-2 text-neutral-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span>You: Benchmark local Whisper WASAPI buffer latency on Windows 11</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Verified Audio Citation Popover Card */}
              {activeCitation && CITATIONS[activeCitation] && (
                <div className="mt-4 p-3 rounded-xl border border-[#ff8133]/40 bg-neutral-950/90 shadow-lg text-xs space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#ff8133] font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Verified Citation #{activeCitation}
                    </span>
                    <span className="text-neutral-400">{CITATIONS[activeCitation].time}</span>
                  </div>
                  <p className="text-neutral-200 italic font-serif">
                    &quot;{CITATIONS[activeCitation].quote}&quot;
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-neutral-400">
                    <span>{CITATIONS[activeCitation].speaker}</span>
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause className="w-3 h-3 text-[#ff8133]" /> : <Play className="w-3 h-3 text-[#ff8133]" />}
                      <span>{isPlayingAudio ? 'Playing Quote' : 'Listen Quote'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Copilot HUD Preview Modal when toggled */}
        {hudOpen && (
          <div className="mt-6 p-4 rounded-xl border border-white/20 bg-neutral-950/95 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-[#ff8133]/20 text-[#ff8133]">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Always-On-Top Meeting Copilot HUD</h4>
                <p className="text-xs text-neutral-400">
                  Floating mini-teleprompter with live real-time transcript and instant AI answers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded border border-emerald-400/20">
                Detached HUD Active
              </span>
              <button
                onClick={() => setHudOpen(false)}
                className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 cursor-pointer"
              >
                Dock Back
              </button>
            </div>
          </div>
        )}

        {/* Windows Download Portal Callout */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-r from-neutral-900 to-neutral-950 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#ff8133] font-medium">
              <Laptop className="w-3.5 h-3.5" />
              <span>Native Windows 10 & 11 (64-bit)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to automate your meeting notes?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg">
              Get the full production app with GPU-accelerated local transcription, SQLite database, and instant Obsidian vault exports.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="https://github.com/tomlin7/Bagrry/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 rounded-xl bg-[#ff8133] hover:bg-[#e66c22] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ff8133]/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download for Windows (x64)</span>
            </a>
            <a
              href="/download"
              className="h-12 px-5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Release Details</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}