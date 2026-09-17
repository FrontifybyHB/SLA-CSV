import { type HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
  style,
  ...rest
}: SkeletonProps) {
  const baseStyles: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--color-sla-surface-container-high) 25%, var(--color-sla-surface-container-highest) 50%, var(--color-sla-surface-container-high) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s ease-in-out infinite',
    borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px',
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1rem' : variant === 'circular' ? '2.5rem' : '1rem'),
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={['relative overflow-hidden rounded-sm bg-sla-border min-h-[1em]', className ?? ''].filter(Boolean).join(' ')} role="status" aria-label="Loading" style={style} {...rest}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="h-4 rounded-[4px] bg-gradient-to-r from-sla-surface-container-high via-sla-surface-container-highest to-sla-surface-container-high bg-[size:200%_100%] animate-skeleton-loading" style={{ width: i === lines - 1 ? '70%' : '100%' }} />
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={['flex gap-4 p-4 border border-sla-outline-variant rounded-lg bg-sla-surface-container-lowest', className ?? ''].filter(Boolean).join(' ')} role="status" aria-label="Loading" style={style} {...rest}>
        <div className="w-12 h-12 rounded-md flex-shrink-0 bg-gradient-to-r from-sla-surface-container-high via-sla-surface-container-highest to-sla-surface-container-high bg-[size:200%_100%] animate-skeleton-loading" />
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="h-5 w-[60%] rounded-[4px] bg-gradient-to-r from-sla-surface-container-high via-sla-surface-container-highest to-sla-surface-container-high bg-[size:200%_100%] animate-skeleton-loading" />
          <div className="h-4 w-full rounded-[4px] bg-gradient-to-r from-sla-surface-container-high via-sla-surface-container-highest to-sla-surface-container-high bg-[size:200%_100%] animate-skeleton-loading" />
          <div className="h-4 w-full rounded-[4px] bg-gradient-to-r from-sla-surface-container-high via-sla-surface-container-highest to-sla-surface-container-high bg-[size:200%_100%] animate-skeleton-loading" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={['relative overflow-hidden rounded-sm bg-sla-border min-h-[1em]', `animate-skeleton-loading`, className ?? ''].filter(Boolean).join(' ')}
      role="status"
      aria-label="Loading"
      style={{ ...baseStyles, ...style }}
      {...rest}
    />
  )
}