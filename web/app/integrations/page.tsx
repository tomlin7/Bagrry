'use client'

import React from 'react'
import { Terminal, Plug, Database, Share2, Bot, Layers } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const INTEGRATIONS = [
  {
    name: 'Model Context Protocol (MCP)',
    tag: 'Standard Protocol',
    description: 'Allow Claude Desktop, Cursor, ChatGPT, and AI agents to query your past meeting context and decisions via local JSON-RPC 2.0 (port 47821).',
    icon: Terminal,
    status: 'Built-in',
  },
  {
    name: 'Notion Sync',
    tag: 'Knowledge Base',
    description: 'Automatically push structured notes, summaries, and meeting dates into your team Notion workspace database.',
    icon: Database,
    status: 'Webhook Ready',
  },
  {
    name: 'Slack Recaps',
    tag: 'Team Communication',
    description: 'Send immediate follow-up bullet points, key decisions, and action items directly into dedicated project channels.',
    icon: Share2,
    status: 'Webhook Ready',
  },
  {
    name: 'Attio & HubSpot CRM',
    tag: 'Sales & Client Ops',
    description: 'Keep customer interaction records, meeting attendees, and deal blockers updated without manual CRM entry.',
    icon: Layers,
    status: 'Webhook Ready',
  },
  {
    name: 'Linear Tickets',
    tag: 'Engineering Ops',
    description: 'Convert meeting action items directly into Linear engineering sprint tickets with 1 click.',
    icon: Plug,
    status: 'Recipe Included',
  },
  {
    name: 'Zapier & Webhooks',
    tag: 'Custom Automations',
    description: 'Trigger custom endpoints whenever a meeting is enhanced with verified transcript citations.',
    icon: Bot,
    status: 'Active API',
  },
]

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] dark:bg-[#161614] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between antialiased">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-36 pb-24 text-center">
        <div className="flex justify-center mb-6">
          <Badge variant="dot" className="px-4 py-1.5 text-xs font-medium">
            Extensible Architecture
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
          Connect your meeting memory
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-16 leading-relaxed">
          No more copy-pasting notes into external AI tools or chat channels. Bagrry connects directly via MCP and webhooks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {INTEGRATIONS.map((tool) => {
            const Icon = tool.icon
            return (
              <Card key={tool.name} className="p-8 flex flex-col justify-between hover:scale-[1.01] transition-transform">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold uppercase px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {tool.status}
                    </span>
                  </div>

                  <CardTitle className="text-xl mb-2">{tool.name}</CardTitle>
                  <p className="text-xs font-mono text-neutral-400 mb-3">{tool.tag}</p>
                  <CardDescription className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </div>

                <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-neutral-500">
                  <span>Zero setup overhead</span>
                  <span className="text-[#7e9900] dark:text-[#c3dd4f] font-medium">Native Support</span>
                </div>
              </Card>
            )
          })}
        </div>
      </main>

      <Footer />
    </div>
  )
}
