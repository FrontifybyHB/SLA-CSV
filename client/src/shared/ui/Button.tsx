import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  pending?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-sla-primary-container text-white shadow-sm hover:bg-sla-primary hover:shadow',
  secondary: 'bg-white text-sla-text border border-sla-border-strong shadow-sm hover:bg-sla-bg hover:border-sla-outline',
  ghost: 'bg-transparent text-sla-primary hover:bg-sla-primary-soft',
  danger: 'bg-sla-danger text-white shadow-sm hover:bg-sla-danger/90',
  link: 'p-0 border-transparent bg-transparent shadow-none text-sla-primary font-semibold hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'px-3 py-2 text-sm',
  sm: 'px-2.5 py-1.5 text-[0.8125rem]',
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
    'inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-medium leading-none cursor-pointer transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-2',
    variantClasses[variant],
    sizeClasses[size],
    pending ? 'cursor-progress' : '',
    (disabled || pending) && 'opacity-55 cursor-not-allowed active:scale-100',
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