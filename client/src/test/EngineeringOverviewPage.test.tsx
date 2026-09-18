import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EngineeringOverviewPage } from '@/pages/engineering/EngineeringOverviewPage'

function renderPage() {
  // Page is public (no auth providers needed).
  render(
    <MemoryRouter>
      <EngineeringOverviewPage />
    </MemoryRouter>,
  )
}

describe('EngineeringOverviewPage', () => {
  it('renders the pipeline, matrix and benchmarks sections', () => {
    renderPage()

    expect(
      screen.getByRole('heading', {
        name: /deterministic sla observability/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('ARCHITECTURE PIPELINE')).toBeInTheDocument()
    expect(screen.getByText('Active SLA Target Matrix')).toBeInTheDocument()
    expect(screen.getByText('Benchmark Verification Suite')).toBeInTheDocument()
  })

  it('links CTAs to real app routes', () => {
    renderPage()

    const dashboardLinks = screen.getAllByRole('link', { name: /open dashboard/i })
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1)
    for (const link of dashboardLinks) {
      expect(link).toHaveAttribute('href', '/dashboard')
    }
    expect(screen.getByRole('link', { name: /view live breach logs/i })).toHaveAttribute(
      'href',
      '/dashboard/breaches',
    )
  })
})
