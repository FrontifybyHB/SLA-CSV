import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
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

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  window.dispatchEvent(new PopStateEvent('popstate'))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('DashboardPage', () => {
  it('loads datasets and shows the selected dataset details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes(`/datasets/${sampleDataset.datasetId}`)) {
          return response(200, { success: true, data: sampleDataset })
        }
        if (url.includes('/datasets')) {
          return response(200, { success: true, data: [sampleDataset] })
        }
        return response(404, { message: 'not found' })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<DashboardPage />)

    expect(screen.getByRole('heading', { name: /sla dashboard/i })).toBeInTheDocument()

    const select = await screen.findByLabelText('Dataset')
    await waitFor(() =>
      expect(screen.getByRole('option', { name: sampleDataset.filename })).toBeInTheDocument(),
    )

    await user.selectOptions(select, sampleDataset.datasetId)

    expect(await screen.findByText(sampleDataset.filename, { selector: 'p' })).toBeInTheDocument()
    // Policy version renders in both the inventory table and dataset overview.
    expect(screen.getAllByText(sampleDataset.policyVersion)).toHaveLength(2)
    expect(window.location.search).toBe(`?dataset=${sampleDataset.datasetId}`)
  })

  it('shows a recoverable error state when the dataset list fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed')
      }),
    )

    renderWithProviders(<DashboardPage />)

    // Both dataset consumers (inventory table + dataset picker) surface the
    // shared list failure with distinct, recoverable error states.
    expect(await screen.findByText('Could not load dataset inventory.', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Could not load datasets.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /retry/i })).toHaveLength(2)
  })
})