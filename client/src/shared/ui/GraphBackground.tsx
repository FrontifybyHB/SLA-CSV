import { memo, useId, type CSSProperties, type ReactNode } from 'react'

export type GraphBackgroundProps = {
  /** Size of a single grid cell in pixels. */
  gridSize?: number
  /** Size of a major grid cell (multiples of gridSize). */
  majorEvery?: number
  /** Background fill color. Use 'transparent' to let the page bg show through. */
  backgroundColor?: string
  /** Fine grid stroke color. */
  fineLineColor?: string
  /** Major grid stroke color. */
  majorLineColor?: string
  /** Show crosshair ticks at major intersections. */
  showTicks?: boolean
  /** Color of tick marks. */
  tickColor?: string
  /** Tick radius in px. */
  tickRadius?: number
  /** Fade overlay direction. */
  fade?: 'none' | 'top' | 'bottom' | 'radial'
  /** Color used for fade overlay (should match surrounding page). */
  fadeColor?: string
  /** Position mode — fixed for site-wide, absolute for section-scoped. */
  position?: 'fixed' | 'absolute'
  /** Extra class names. */
  className?: string
  /** Extra inline styles. */
  style?: CSSProperties
  /** Z-index for the background layer. */
  zIndex?: number
  /** Optional children (e.g. floating accents). */
  children?: ReactNode
}

/**
 * Blueprint graph backdrop: fine grid + major grid + intersection ticks,
 * rendered as SVG so it stays crisp at any size. Decorative only
 * (`aria-hidden`, pointer-events off) — content must sit in a positioned
 * sibling above it.
 */
export const GraphBackground = memo(function GraphBackground({
  gridSize = 24,
  majorEvery = 5,
  backgroundColor = '#FFFFFF',
  fineLineColor = 'rgba(226, 232, 240, 0.6)',
  majorLineColor = 'rgba(148, 163, 184, 0.45)',
  showTicks = true,
  tickColor = 'rgba(148, 163, 184, 0.55)',
  tickRadius = 1.75,
  fade = 'none',
  fadeColor = '#FFFFFF',
  position = 'absolute',
  className = '',
  style,
  zIndex = 0,
  children,
}: GraphBackgroundProps) {
  const fineId = useId()
  const majorId = useId()
  const tickId = useId()

  const majorSize = gridSize * majorEvery

  return (
    <div
      aria-hidden="true"
      className={`${position} inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ backgroundColor, zIndex, ...style }}
    >
      <svg className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={fineId} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke={fineLineColor}
              strokeWidth="1"
            />
          </pattern>

          <pattern id={majorId} width={majorSize} height={majorSize} patternUnits="userSpaceOnUse">
            <rect width={majorSize} height={majorSize} fill={`url(#${fineId})`} />
            <path
              d={`M ${majorSize} 0 L 0 0 0 ${majorSize}`}
              fill="none"
              stroke={majorLineColor}
              strokeWidth="1"
            />
          </pattern>

          <pattern id={tickId} width={majorSize} height={majorSize} patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r={tickRadius} fill={tickColor} />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${majorId})`} />
        {showTicks && <rect width="100%" height="100%" fill={`url(#${tickId})`} />}
      </svg>

      {fade !== 'none' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              fade === 'radial'
                ? `radial-gradient(ellipse at center, transparent 0%, ${fadeColor} 85%)`
                : fade === 'top'
                  ? `linear-gradient(to bottom, ${fadeColor} 0%, transparent 35%)`
                  : `linear-gradient(to top, ${fadeColor} 0%, transparent 35%)`,
          }}
        />
      )}

      {children}
    </div>
  )
})

export default GraphBackground
