import React from 'react'
import { Card, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { ArrowUpRight } from 'lucide-react'

export function McpShowcase() {
  return (
    <section id="mcp" className="py-24 md:py-32">
      <div className="max-w-[1140px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7e9900] dark:text-[#c3dd4f] block mb-3">
            Ecosystem & Integrations
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            How does it work?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Pillar 1: Memory MCP */}
          <Card className="p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                  Standard Protocol
                </span>
                <span className="text-xs font-mono text-neutral-400">port 47821</span>
              </div>

              <CardTitle className="text-2xl md:text-3xl mb-3">
                Memory MCP
              </CardTitle>
              <CardDescription className="text-base text-neutral-600 dark:text-neutral-400 mb-6">
                Captures your personal meeting context so you never explain yourself to AI again. Plugs into Claude Desktop, Cursor, ChatGPT, and autonomous coding agents.
              </CardDescription>

              {/* Code snippet showing MCP JSON-RPC call */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-200 text-xs font-mono leading-relaxed overflow-x-auto shadow-inner mb-6">
                <div className="flex items-center justify-between text-neutral-500 text-[10px] pb-2 mb-2 border-b border-neutral-800">
                  <span>POST /mcp · JSON-RPC 2.0</span>
                  <span className="text-emerald-400">Connected</span>
                </div>
                <p className="text-neutral-400">{`// Claude asking Bagrry MCP for meeting context:`}</p>
                <p className="text-emerald-400">{`mcp.tools.call("query_meetings", {`}</p>
                <p className="pl-4 text-neutral-300">{`"query": "Q4 architecture decisions"`}</p>
                <p className="text-emerald-400">{`})`}</p>
              </div>
            </div>

            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="pill" className="gap-2 text-xs font-medium">
                <span>Check out MCP specs</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </Card>

          {/* Pillar 2: Open Loops Inbox */}
          <Card className="p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group border-2 border-neutral-900/10 dark:border-white/15">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#c3dd4f] text-[#1e2604]">
                  Active Core
                </span>
                <span className="text-xs font-mono text-neutral-400">Zero Missed Tasks</span>
              </div>

              <CardTitle className="text-2xl md:text-3xl mb-3">
                Open loops Inbox
              </CardTitle>
              <CardDescription className="text-base text-neutral-600 dark:text-neutral-400 mb-6">
                Uses your personal context and never lets you miss your commitments. Seamlessly tracks what you owe others and what others owe you.
              </CardDescription>

              {/* Task Cards Preview */}
              <div className="space-y-2.5 mb-6">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#282826] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    Review native window drag benchmark numbers
                  </span>
                  <span className="font-mono text-neutral-400 text-[10px]">Oct 30</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#282826] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    Draft follow-up email to Vertex Systems leadership
                  </span>
                  <span className="font-mono text-neutral-400 text-[10px]">Today</span>
                </div>
              </div>
            </div>

            {/* Playful Handwritten Note Badge */}
            <div className="flex items-center gap-2 pt-4">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-serif italic bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/60 px-3 py-1.5 rounded-full shadow-sm">
                ✏️ You are here right now
              </span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
