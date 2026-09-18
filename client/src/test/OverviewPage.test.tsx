import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { OverviewPage } from '@/pages/dashboard/overview/OverviewPage'
import { renderWithProviders } from './render'
import { sampleDataset } from './fixtures'

function response(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  }
}

const sampleStats = {
  datasetIds: ['ds-1'],
  totalSlots: 4,
  uptimeSeconds: 10000,
  downtimeSeconds: 6,
  unknownSeconds: 0,
  availabilityPct: 99.942,
  averageLatencyMs: 38.4,
  counts: { up: 3, down: 1, unknown: 0, mixed: 0 },
}

const sampleLogs = {
  observations: [
    { row: 7, datasetId: 'ds-1', agentId: 'agent-9', timestamp: '2026-09-14T10:00:00.000Z', latencyMs: 914, status: 'DOWN' },
    { row: 6, datasetId: 'ds-1', agentId: 'agent-3', timestamp: '2026-09-14T09:00:00.000Z', latencyMs: 41, status: 'UP' },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
}

const sampleSlots = {
  slots: [
    { datasetId: 'ds-1', slotKey: 's-1', startTime: '2026-09-14T09:00:00.000Z', endTime: '2026-09-14T10:00:00.000Z', durationSeconds: 3600, uptimeSeconds: 3600, downtimeSeconds: 0, unknownSeconds: 0, averageLatencyMs: 38.4, status: 'up' },
    { datasetId: 'ds-1', slotKey: 's-2', startTime: '2026-09-14T10:00:00.000Z', endTime: '2026-09-14T11:00:00.000Z', durationSeconds: 3600, uptimeSeconds: 0, downtimeSeconds: 3600, unknownSeconds: 0, averageLatencyMs: 914.2, status: 'down' },
  ],
  total: 2,
  page: 1,
  pageSize: 100,
  from: '2026-09-01T00:00:00.000Z',
  to: '2026-09-15T00:00:00.000Z',
}

function stubApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/reporting/stats')) return response(200, { success: true, data: sampleStats })
      if (url.includes('/reporting/logs')) return response(200, { success: true, data: sampleLogs })
      if (url.includes('/reporting/slots')) return response(200, { success: true, data: sampleSlots })
      if (url.includes(`/datasets/${sampleDataset.datasetId}`)) {
        return response(200, { success: true, data: sampleDataset })
      }
      if (url.includes('/datasets')) {
        return response(200, { success: true, data: [sampleDataset] })
      }
      return response(404, { message: 'not found' })
    }),
  )
}

beforeEach(() => {
  window.history.replaceState(null, '', '/dashboard?dataset=ds-1')
  window.dispatchEvent(new PopStateEvent('popstate'))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
  window.dispatchEvent(new PopStateEvent('popstate'))
})

describe('OverviewPage (main dashboard at /dashboard)', () => {
  it('renders live availability from the reporting API', async () => {
    stubApi()
    renderWithProviders(<OverviewPage />)

    expect(screen.getByRole('heading', { name: /production dashboard/i })).toBeInTheDocument()
    // availabilityPct rendered with 3 decimals from the mocked stats
    expect((await screen.findAllByText('99.942')).length).toBeGreaterThanOrEqual(1)
    // dataset quality card shows real import counters
    expect(screen.getByText(/119 rows parsed from/i)).toBeInTheDocument()
  })

  it('navigates with the swapped routes: overview on /dashboard, datasets on /dashboard/dataset', async () => {
    stubApi()
    renderWithProviders(<OverviewPage />)

    await screen.findAllByText('99.942')

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Datasets' })).toHaveAttribute('href', '/dashboard/dataset')

    // breach log rows from the mocked logs endpoint (incidents card + table)
    expect(screen.getAllByText('agent-9').length).toBeGreaterThanOrEqual(1)
  })

  it('keeps no links to the legacy /dashboard/overview alias', async () => {
    stubApi()
    const { container } = renderWithProviders(<OverviewPage />)

    await screen.findAllByText('99.942')

    expect(container.querySelector('a[href="/dashboard/overview"]')).toBeNull()
    expect(container.querySelector('a[href^="/dashboard/overview?"]')).toBeNull()
  })
})
