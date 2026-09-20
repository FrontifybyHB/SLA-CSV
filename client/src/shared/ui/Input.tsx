import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...rest },
  ref,
) {
  const classes = [
    'w-full h-10 px-3 bg-white border border-sla-outline-variant/70 rounded-[5px] text-sla-on-surface text-body-md font-sla placeholder:text-sla-text-faint shadow-sm transition-all duration-150 focus:outline-none focus:border-sla-primary focus:ring-2 focus:ring-sla-primary/20',
    invalid && 'border-sla-danger focus:border-sla-danger focus:ring-sla-danger/20',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return <input ref={ref} className={classes} {...rest} />
})