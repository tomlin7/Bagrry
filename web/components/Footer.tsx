import React from 'react'

export function Footer() {
  return (
    <footer className="py-16 border-t border-black/[0.06] dark:border-white/[0.06] text-neutral-500 text-xs">
      <div className="max-w-[1140px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          {/* Brand & Tagline */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded bg-[#c3dd4f] flex items-center justify-center text-[#1e2604] font-bold text-[10px]">
                B
              </div>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                Bagrry
              </span>
            </div>
            <p className="text-neutral-400">
              Personal intelligence that comes to you.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-neutral-600 dark:text-neutral-400 font-medium">
            <a href="#privacy" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              Privacy policy
            </a>
            <a href="#terms" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              Terms of service
            </a>
            <a href="#refund" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              Refund policy
            </a>
            <a href="#mcp" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              MCP Protocol
            </a>
            <a href="mailto:support@bagrry.dev" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              Contact us
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-black/[0.04] dark:border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400 text-[11px]">
          <span>© 2026 Bagrry Intelligence, Inc. All rights reserved.</span>
          <span>Rendered natively with GPUIX · Powered by Local Whisper & MCP</span>
        </div>
      </div>
    </footer>
  )
}
