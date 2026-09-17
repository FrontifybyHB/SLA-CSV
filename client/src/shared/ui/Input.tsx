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
    'w-full h-10 px-2.5 bg-sla-surface-container-lowest border border-sla-outline-variant/60 rounded-[2px] text-sla-on-surface text-body-md font-sla placeholder:text-sla-outline-variant/70 transition-colors focus:outline-none focus:border-sla-primary focus:shadow-focus',
    invalid && 'border-sla-danger focus:border-sla-danger focus:shadow-[0_0_0_3px_rgb(200_30_30/0.25)]',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return <input ref={ref} className={classes} {...rest} />
})