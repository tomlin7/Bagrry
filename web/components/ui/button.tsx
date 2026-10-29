import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'accent'
  size?: 'default' | 'sm' | 'lg' | 'pill'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 select-none'

    const variants = {
      default: 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm',
      dark: 'bg-[#1c1c1c] text-white hover:bg-[#282828] border border-white/10 shadow-sm',
      accent: 'bg-[#c3dd4f] text-[#1e2604] hover:bg-[#b0cb3c] font-semibold shadow-sm',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100',
      outline: 'border border-neutral-300 bg-white/60 hover:bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-200',
      ghost: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
    }

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm rounded-xl',
      sm: 'h-8 px-3 text-xs rounded-lg',
      lg: 'h-12 px-6 text-base rounded-2xl',
      pill: 'h-11 px-6 text-sm rounded-full',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
