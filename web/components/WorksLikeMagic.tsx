import React from 'react'
import { Card, CardTitle, CardDescription } from './ui/card'
import { CheckCircle2, Mail, Calendar, MessageSquare, Video, Sparkles } from 'lucide-react'

const APPS = [
  { name: 'Google Meet', icon: Video, color: 'text-emerald-500' },
  { name: 'Zoom', icon: Video, color: 'text-blue-500' },
  { name: 'Microsoft Teams', icon: Video, color: 'text-indigo-500' },
  { name: 'Slack Huddles', icon: MessageSquare, color: 'text-amber-500' },
  { name: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600' },
  { name: 'Loom', icon: Video, color: 'text-orange-500' },
  { name: 'Google Calendar', icon: Calendar, color: 'text-blue-600' },
  { name: 'and more…', icon: Sparkles, color: 'text-purple-500' },
]

export function WorksLikeMagic() {
  return (
    <section id="works-like-magic" className="py-24 md:py-32">
      <div className="max-w-[1140px] mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7e9900] dark:text-[#c3dd4f] block mb-3">
            Effortless Automation
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Works like magic
          </h2>
        </div>

        {/* 3 Bento Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Finds open loops */}
          <Card className="md:col-span-6 p-8 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div>
              <span className="text-3xl md:text-4xl font-bold text-neutral-400 font-mono block mb-4">
                1.
              </span>
              <CardTitle className="text-2xl md:text-3xl mb-3">
                Bagrry finds your open loops
              </CardTitle>
              <CardDescription className="text-base text-neutral-600 dark:text-neutral-400 mb-8">
                Captures your personal context from dual-channel audio and finds your high-value action items automatically.
              </CardDescription>
            </div>

            {/* Interactive Visual Preview */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#252523] border border-black/[0.05] dark:border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-neutral-400">
                <span>Extracted Action Item</span>
                <span className="text-emerald-600 font-mono">Assigned</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#2e2e2a] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Send revised contract draft with quarterly true-ups
                  </span>
                </div>
                <span className="text-xs font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                  Due Friday
                </span>
              </div>
            </div>
          </Card>

          {/* Card 2: Closes them automatically */}
          <Card className="md:col-span-6 p-8 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div>
              <span className="text-3xl md:text-4xl font-bold text-neutral-400 font-mono block mb-4">
                2.
              </span>
              <CardTitle className="text-2xl md:text-3xl mb-3">
                then closes them automatically
              </CardTitle>
              <CardDescription className="text-base text-neutral-600 dark:text-neutral-400 mb-8">
                Traces your decisions, crafts follow-up emails, and resolves closed loops without manual effort.
              </CardDescription>
            </div>

            {/* Interactive Visual Preview: Follow-up Email Generator */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#252523] border border-black/[0.05] dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Drafted Follow-up</span>
                </span>
                <span className="text-[#7e9900] dark:text-[#c3dd4f] font-mono text-[10px]">1-Click Copy</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#2e2e2a] border border-black/[0.04] dark:border-white/[0.06] text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 font-mono">
                <p className="font-semibold mb-1">Subject: Recap & Next Steps from Roadmap Sync</p>
                <p className="text-neutral-500 dark:text-neutral-400">
                  &ldquo;Hi Sarah, thanks for syncing today. As discussed, we are transitioning to native GPUIX rendering. Next steps: finalize benchmark specs by Friday.&rdquo;
                </p>
              </div>
            </div>
          </Card>

          {/* Card 3: Full Width Integration Tile */}
          <Card className="md:col-span-12 p-8 md:p-10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="max-w-2xl mb-8">
              <CardTitle className="text-2xl md:text-3xl mb-3">
                Supports all meeting apps
              </CardTitle>
              <CardDescription className="text-base text-neutral-600 dark:text-neutral-400">
                Bagrry works right out of the box with zero integrations or awkward meeting bots joining your calls.
              </CardDescription>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {APPS.map((app) => {
                const Icon = app.icon
                return (
                  <div
                    key={app.name}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#252523] border border-black/[0.04] dark:border-white/[0.06] hover:bg-neutral-100 dark:hover:bg-[#2d2d2a] transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${app.color}`} />
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {app.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
