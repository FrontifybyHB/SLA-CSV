import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  pending?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-sla-primary text-white hover:bg-sla-primary-hover',
  secondary: 'bg-sla-surface text-sla-text border border-sla-border-strong hover:bg-sla-bg',
  ghost: 'bg-transparent text-sla-primary hover:bg-sla-primary-soft',
  danger: 'bg-sla-danger text-white hover:bg-sla-danger/95',
  link: 'p-0 border-transparent bg-transparent text-sla-primary font-semibold hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'px-3.5 py-2 text-base',
  sm: 'px-2.5 py-1.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  pending = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-sm border border-transparent font-medium leading-none cursor-pointer transition-colors',
    variantClasses[variant],
    sizeClasses[size],
    pending ? 'cursor-progress' : '',
    (disabled || pending) && 'opacity-55 cursor-not-allowed',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...rest}
    >
      {children}
    </button>
  )
}