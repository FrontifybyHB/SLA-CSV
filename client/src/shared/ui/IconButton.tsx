import type { ButtonHTMLAttributes } from 'react'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function IconButton({ label, type = 'button', className, children, ...rest }: IconButtonProps) {
  const classes = ['inline-flex items-center justify-center p-0 border-none bg-transparent font-inherit text-inherit cursor-pointer', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} aria-label={label} className={classes} {...rest}>
      {children}
    </button>
  )
}