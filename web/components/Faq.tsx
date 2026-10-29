import React from 'react'
import { Accordion, type AccordionItemData } from './ui/accordion'

const FAQ_ITEMS: AccordionItemData[] = [
  {
    id: 'faq-1',
    question: 'How can Bagrry help me?',
    answer:
      'Bagrry captures your meeting audio and manual scratchpad notes to synthesize executive summaries, link exact sentence citations, and automatically extract action items. If you have back-to-back calls or context-switch frequently, Bagrry ensures you never lose a commitment.',
  },
  {
    id: 'faq-2',
    question: 'What is memory?',
    answer:
      'Memory is your personal meeting context and past decisions. Just like your brain recalls what was agreed upon last week, Bagrry organizes all past conversations into a searchable local database that connects to your workflow.',
  },
  {
    id: 'faq-3',
    question: 'What is Bagrry MCP?',
    answer:
      'Bagrry MCP is a local Model Context Protocol server running on port 47821. It acts as a universal bridge so you can query your meeting notes, transcripts, and action items directly from Claude Desktop, Cursor, ChatGPT, or autonomous AI agents.',
  },
  {
    id: 'faq-4',
    question: 'How private is my data?',
    answer:
      'Your memory is stored locally on your machine in an encrypted SQLite database with WAL mode. We strictly do not store your private notes on cloud servers, train on your audio, or resell data.',
  },
  {
    id: 'faq-5',
    question: 'Do you take screenshots or send meeting bots?',
    answer:
      'No! Bagrry never sends annoying bots to join your Zoom, Google Meet, or Teams calls. It captures audio directly from your system loopback (WASAPI on Windows, CoreAudio on Mac) for 100% discrete and reliable recording.',
  },
  {
    id: 'faq-6',
    question: 'Can I run OpenAI Whisper locally and offline?',
    answer:
      'Yes! Bagrry supports running quantized Whisper models (such as small.en or large-v3-turbo) locally using CPU AVX2 instructions or Vulkan acceleration, giving you full speech-to-text functionality even with zero internet.',
  },
]

export function Faq() {
  return (
    <section id="faqs" className="py-24 md:py-32">
      <div className="max-w-[860px] mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7e9900] dark:text-[#c3dd4f] block mb-3">
            Common Questions
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            FAQs
          </h2>
        </div>

        <Accordion items={FAQ_ITEMS} />
      </div>
    </section>
  )
}
