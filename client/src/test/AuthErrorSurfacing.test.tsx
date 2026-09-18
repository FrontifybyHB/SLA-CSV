import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '@/pages/auth/components/SignInForm'
import { RegisterForm } from '@/pages/auth/components/RegisterForm'
import { renderWithProviders } from './render'

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('auth error surfacing', () => {
  it('shows "Invalid email or password" when login returns 401', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(401, {
          success: false,
          statusCode: 401,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        }),
      ),
    )
    renderWithProviders(<SignInForm onSwitchToRegister={() => {}} />)

    await user.type(screen.getByLabelText(/work email/i), 'ghost-nobody@test.com')
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in to sla monitor/i }))

    const matches = await screen.findAllByText('Invalid email or password')
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows the server message when registration fails with 400', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(400, {
          success: false,
          statusCode: 400,
          message: 'Registration failed',
          code: 'REGISTRATION_FAILED',
        }),
      ),
    )
    renderWithProviders(<RegisterForm onSwitchToLogin={() => {}} />)

    await user.type(screen.getByLabelText(/work email/i), 'taken@test.com')
    await user.type(screen.getByPlaceholderText('Create password (min. 8 chars)'), 'password123')
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    const matches = await screen.findAllByText('Registration failed')
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows a diagnosable message when the server is unreachable', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed')
      }),
    )
    renderWithProviders(<SignInForm onSwitchToRegister={() => {}} />)

    await user.type(screen.getByLabelText(/work email/i), 'alex@test.com')
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in to sla monitor/i }))

    // Must never fail silently: some human-readable message is required.
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
