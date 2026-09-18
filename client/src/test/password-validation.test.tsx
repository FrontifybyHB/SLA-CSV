import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthCard } from '@/pages/auth/components/AuthCard'
import { renderWithProviders } from './render'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubFetch() {
  const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('auth password validation feedback', () => {
  it('register: short password shows the 8-character error and never calls the API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()

    renderWithProviders(<AuthCard />)
    await user.click(screen.getByRole('tab', { name: /create account/i }))

    await user.type(screen.getAllByLabelText(/work email/i)[1], 'a@b.co')
    await user.type(screen.getByPlaceholderText(/create password/i), 'short')
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'short')
    await user.click(screen.getByRole('button', { name: /^create account$/i }))

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('register: empty submit shows required errors and never calls the API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()

    renderWithProviders(<AuthCard />)
    await user.click(screen.getByRole('tab', { name: /create account/i }))

    await user.type(screen.getAllByLabelText(/work email/i)[1], 'a@b.co')
    await user.click(screen.getByRole('button', { name: /^create account$/i }))

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sign in: short password shows the 8-character error and never calls the API', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()

    renderWithProviders(<AuthCard />)

    await user.type(screen.getAllByLabelText(/work email/i)[0], 'a@b.co')
    await user.type(screen.getByPlaceholderText(/••••/i), 'short')
    await user.click(screen.getByRole('button', { name: /sign in to/i }))

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('register: password field advertises the 8-character minimum up front', async () => {
    const user = userEvent.setup()
    stubFetch()

    renderWithProviders(<AuthCard />)
    await user.click(screen.getByRole('tab', { name: /create account/i }))

    expect(screen.getByText(/minimum 8 characters/i)).toBeInTheDocument()
  })
})
