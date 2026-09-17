import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { RequireAuth } from '@/features/auth'
import { renderWithProviders } from './render'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('RequireAuth', () => {
  it('renders protected content when the session is valid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { user: { id: 'user-1', role: 'user' } })),
    )

    renderWithProviders(
      <RequireAuth>
        <p>Protected dashboard</p>
      </RequireAuth>,
    )

    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument()
  })

  it('does not render protected content on 401', async () => {
    let resolveFetch: (value: Response) => void
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })

    const mockFetch = vi.fn(() => fetchPromise)
    vi.stubGlobal('fetch', mockFetch)

    renderWithProviders(
      <RequireAuth>
        <p>Protected dashboard</p>
      </RequireAuth>,
    )

    // First shows spinner while loading
    expect(await screen.findByRole('status', { name: 'Checking session' })).toBeInTheDocument()

    // Resolve with 401
    resolveFetch!(jsonResponse(401, { error: { message: 'Authentication required', code: 'UNAUTHORIZED' } }))
    await fetchPromise
  })

  it('shows a retryable error instead of redirecting on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed')
      }),
    )

    renderWithProviders(
      <RequireAuth>
        <p>Protected dashboard</p>
      </RequireAuth>,
    )

    expect(await screen.findByText(/could not verify your session/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument()
  })
})