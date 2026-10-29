import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'accent' | 'dot'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors'

  const variants = {
    default: 'bg-neutral-900 text-white',
    secondary: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700',
    outline: 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-white/50 backdrop-blur-sm',
    accent: 'bg-[#c3dd4f]/20 text-[#4c5f0a] border border-[#c3dd4f]/40 dark:bg-[#c3dd4f]/15 dark:text-[#c3dd4f]',
    dot: 'bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
  }

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {variant === 'dot' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {children}
    </div>
  )
}
