import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { GraphBackground } from '@/shared/ui/GraphBackground'

describe('GraphBackground', () => {
  it('renders a decorative SVG grid that is hidden from assistive tech', () => {
    const { container } = render(<GraphBackground />)

    const backdrop = container.firstChild as HTMLElement
    expect(backdrop.getAttribute('aria-hidden')).toBe('true')
    expect(backdrop.className).toContain('pointer-events-none')
    expect(container.querySelector('svg')).toBeInTheDocument()
    // fine + major + tick patterns
    expect(container.querySelectorAll('pattern')).toHaveLength(3)
  })

  it('generates unique pattern ids per instance', () => {
    const { container } = render(
      <>
        <GraphBackground />
        <GraphBackground />
      </>,
    )
    const ids = [...container.querySelectorAll('pattern')].map((p) => p.getAttribute('id'))
    expect(ids).toHaveLength(6)
    expect(new Set(ids).size).toBe(6)
  })

  it('renders a fade overlay only when requested', () => {
    const { container, rerender } = render(<GraphBackground fade="none" />)
    expect(container.firstChild?.childNodes).toHaveLength(1)

    rerender(<GraphBackground fade="bottom" fadeColor="#ffffff" />)
    expect(container.firstChild?.childNodes).toHaveLength(2)
  })
})
