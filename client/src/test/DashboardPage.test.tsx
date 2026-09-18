import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
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

    expect(screen.getByRole('heading', { name: /csv ingest workspace/i })).toBeInTheDocument()

    // Inventory table is now the single dataset picker (duplicate dropdown removed).
    const selectBtn = await screen.findByRole('button', { name: /select/i })
    await user.click(selectBtn)

    // Filename renders once in the dataset overview; diagnostics stays
    // closed until the user opens it on demand.
    expect(await screen.findAllByText(sampleDataset.filename, { selector: 'p' })).toHaveLength(1)
    expect(screen.queryByRole('complementary', { name: /diagnostic panel/i })).not.toBeInTheDocument()

    // Opening diagnostics reveals the same dataset (filename twice,
    // policy version in inventory + overview + panel).
    await user.click(screen.getByRole('button', { name: /open diagnostics panel/i }))
    // Panel is code-split: allow time for the lazy chunk under load.
    await screen.findByRole('complementary', { name: /diagnostic panel/i }, { timeout: 5000 })
    expect(await screen.findAllByText(sampleDataset.filename, { selector: 'p' })).toHaveLength(2)
    // Policy version renders in the inventory table, dataset overview and diagnostics panel.
    expect(screen.getAllByText(sampleDataset.policyVersion)).toHaveLength(3)
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

    // Single inventory table surfaces the list failure with a retry.
    expect(await screen.findByText('Could not load dataset inventory.', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /retry/i })).toHaveLength(1)
  })
})