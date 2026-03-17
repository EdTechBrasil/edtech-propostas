'use client'

import * as React from 'react'
import { cn } from '@/utils/cn'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        'h-4 w-4 rounded border border-slate-300 bg-white text-primary accent-primary cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-slate-600 dark:bg-slate-900',
        className
      )}
      onChange={e => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
