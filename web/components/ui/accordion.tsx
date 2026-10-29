'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccordionItemData {
  id: string
  question: string
  answer: string
}

export interface AccordionProps {
  items: AccordionItemData[]
  className?: string
}

export function Accordion({ items, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null)

  const toggle = (id: string) => {
    setOpenId((curr) => (curr === id ? null : id))
  }

  return (
    <div className={cn('divide-y divide-black/[0.08] dark:divide-white/[0.08]', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <div key={item.id} className="py-4 md:py-5 transition-colors">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between text-left font-medium text-base md:text-lg text-neutral-900 dark:text-neutral-100 hover:text-neutral-700 transition-colors py-1 focus:outline-none"
            >
              <span>{item.question}</span>
              <span
                className={cn(
                  'ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 transition-transform duration-200',
                  isOpen && 'rotate-180 bg-neutral-200 dark:bg-neutral-700'
                )}
              >
                <ChevronDown className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
              </span>
            </button>
            <div
              className={cn(
                'grid transition-all duration-300 ease-in-out',
                isOpen ? 'grid-rows-[1fr] opacity-100 pt-3' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <p className="text-sm md:text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
