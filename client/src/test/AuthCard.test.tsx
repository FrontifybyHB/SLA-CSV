import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthCard } from '@/pages/auth/components/AuthCard'
import { renderWithProviders } from './render'

describe('AuthCard', () => {
  it('offers email + password sign-in only, no OAuth buttons', () => {
    renderWithProviders(<AuthCard />)

    expect(screen.queryByText(/continue with github/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/continue with google/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/saml|oidc|enterprise idp/i)).not.toBeInTheDocument()

    // Both tab panels (sign-in + register) render email fields.
    expect(screen.getAllByLabelText(/work email/i)).toHaveLength(2)
    expect(
      screen.getByText(/email \+ password sign-in only/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /create account/i })).toBeInTheDocument()
  })

  it('switches modes through the inline Register / Sign in buttons', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AuthCard />)

    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(screen.getByRole('tab', { name: /create account/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByRole('tab', { name: /sign in/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
