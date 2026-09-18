import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BreachLogsPage } from '@/pages/dashboard/breaches/BreachLogsPage'
import { observationsToCsv } from '@/pages/dashboard/breaches/lib/breach-csv'
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

const sampleLogs = {
  observations: [
    { row: 7, datasetId: 'ds-1', service: 'api', agentId: 'agent-9', region: 'us-east', timestamp: '2026-09-14T10:00:00.000Z', latencyMs: 914, status: 'DOWN' },
    { row: 6, datasetId: 'ds-1', service: 'api', agentId: 'agent-3', region: 'us-east', timestamp: '2026-09-14T09:00:00.000Z', latencyMs: 41, status: 'UP' },
  ],
  total: 2,
  page: 1,
  pageSize: 15,
}

function stubApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/reporting/logs')) return response(200, { success: true, data: sampleLogs })
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
  window.history.replaceState(null, '', '/dashboard/breaches?dataset=ds-1')
  window.dispatchEvent(new PopStateEvent('popstate'))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
  window.dispatchEvent(new PopStateEvent('popstate'))
})

describe('BreachLogsPage', () => {
  it('renders real observation rows with pagination from the API total', async () => {
    stubApi()
    renderWithProviders(<BreachLogsPage />)

    expect(screen.getByRole('heading', { name: /breach logs/i })).toBeInTheDocument()
    expect(await screen.findByText('agent-9')).toBeInTheDocument()
    expect(screen.getByText('agent-3')).toBeInTheDocument()
    expect(screen.getAllByText((_, el) => el?.textContent?.includes('of 2 breach records') ?? false).length).toBeGreaterThanOrEqual(1)
  })

  it('filters rows by status chip without another API call', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/reporting/logs')) return response(200, { success: true, data: sampleLogs })
      if (url.includes(`/datasets/${sampleDataset.datasetId}`)) {
        return response(200, { success: true, data: sampleDataset })
      }
      if (url.includes('/datasets')) {
        return response(200, { success: true, data: [sampleDataset] })
      }
      return response(404, { message: 'not found' })
    })
    vi.stubGlobal('fetch', fetchMock)
    renderWithProviders(<BreachLogsPage />)

    await screen.findByText('agent-9')
    const callsBefore = fetchMock.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'UP' }))
    expect(screen.queryByText('agent-9')).not.toBeInTheDocument()
    expect(screen.getByText('agent-3')).toBeInTheDocument()
    expect(fetchMock.mock.calls.length).toBe(callsBefore)
  })

  it('expands a row to show its real source record', async () => {
    const user = userEvent.setup()
    stubApi()
    renderWithProviders(<BreachLogsPage />)

    await screen.findByText('agent-9')
    await user.click(screen.getAllByRole('button', { name: /inspect/i })[0])

    expect(await screen.findByText(/observation detail/i)).toBeInTheDocument()
    expect(screen.getByText(/"agentId": "agent-9"/)).toBeInTheDocument()
  })

  it('serializes observations to CSV with header + rows', () => {
    const csv = observationsToCsv(sampleLogs.observations)
    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('timestamp,service,agent_id,region,dataset_id,row,latency_ms,status')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain('agent-9')
  })
})
