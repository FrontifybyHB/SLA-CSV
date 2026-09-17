import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className, ...rest },
  ref,
) {
  const classes = [
    'w-full h-10 px-3 bg-sla-surface-container-lowest border border-sla-outline-variant/60 rounded-sm text-sla-on-surface text-body-md font-sla focus:outline-none focus:border-sla-primary focus:shadow-focus',
    invalid && 'border-sla-danger focus:border-sla-danger focus:shadow-[0_0_0_3px_rgb(200_30_30/0.25)]',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return <select ref={ref} className={classes} {...rest} />
})