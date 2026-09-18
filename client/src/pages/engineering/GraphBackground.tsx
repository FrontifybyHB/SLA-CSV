import { memo, useId } from 'react'

export interface GraphBackgroundProps {
  position?: 'absolute' | 'relative' | 'fixed'
  /** Fine grid cell size in px. */
  gridSize?: number
  /** A major line + tick is drawn every N fine cells. */
  majorEvery?: number
  backgroundColor?: string
  fineLineColor?: string
  majorLineColor?: string
  tickColor?: string
  zIndex?: number
  className?: string
}

/**
 * Blueprint-style graph canvas: fine grid + major grid + axis ticks at
 * major intersections, rendered as one lightweight SVG that fills its
 * positioned parent. Decorative only (`aria-hidden`).
 */
export const GraphBackground = memo(function GraphBackground({
  position = 'absolute',
  gridSize = 24,
  majorEvery = 5,
  backgroundColor = '#FFFFFF',
  fineLineColor = 'rgba(241, 245, 249, 1)',
  majorLineColor = 'rgba(203, 213, 225, 0.5)',
  tickColor = 'rgba(148, 163, 184, 0.45)',
  zIndex = 0,
  className = '',
}: GraphBackgroundProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const major = Math.max(1, Math.round(gridSize * majorEvery))

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none ${className}`.trim()}
      style={{
        position,
        inset: position === 'relative' ? undefined : 0,
        width: '100%',
        height: '100%',
        zIndex,
        backgroundColor,
      }}
    >
      <defs>
        <pattern
          id={`eo-fine-${uid}`}
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke={fineLineColor}
            strokeWidth={1}
          />
        </pattern>
        <pattern
          id={`eo-major-${uid}`}
          width={major}
          height={major}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${major} 0 L 0 0 0 ${major}`}
            fill="none"
            stroke={majorLineColor}
            strokeWidth={1}
          />
          <path
            d="M -5 0 H 5 M 0 -5 V 5"
            fill="none"
            stroke={tickColor}
            strokeWidth={1.5}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#eo-fine-${uid})`} />
      <rect width="100%" height="100%" fill={`url(#eo-major-${uid})`} />
    </svg>
  )
})
