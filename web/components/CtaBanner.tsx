import React from 'react'
import { Download, Apple } from 'lucide-react'
import { Button } from './ui/button'

export function CtaBanner() {
  return (
    <section className="py-24 md:py-32 bg-neutral-900 text-white rounded-[2.5rem] mx-4 sm:mx-6 my-12 relative overflow-hidden text-center">
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#c3dd4f_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="max-w-[800px] mx-auto px-6 relative z-10">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Stay on top of your work
        </h2>
        <p className="text-neutral-400 text-base md:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
          No setup needed. No meeting bots. Just download and begin taking notes that close your open loops.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a href="/download">
            <Button
              variant="accent"
              size="pill"
              className="w-full sm:w-auto px-8 gap-2.5 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download for Windows</span>
            </Button>
          </a>
          <a href="/download?platform=mac">
            <Button
              variant="dark"
              size="pill"
              className="w-full sm:w-auto px-7 gap-2.5 border border-white/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Apple className="w-4 h-4" />
              <span>Download for macOS</span>
            </Button>
          </a>
        </div>

        <p className="text-xs text-neutral-500 font-mono">
          Free unlimited notes · No credit card required
        </p>
      </div>
    </section>
  )
}
