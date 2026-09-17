import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopNav } from '@/pages/home/TopNav'
import { AuthHeader } from '@/pages/auth/components/AuthHeader'

afterEach(() => {
  window.location.hash = ''
})

describe('shared dynamic TopNav', () => {
  it('renders the primary links with the first one active by default', () => {
    render(<TopNav />)

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    for (const label of ['Features', 'How it works', 'API']) {
      expect(nav).toHaveTextContent(label)
    }

    const features = screen.getAllByRole('link', { name: 'Features' })[0]
    expect(features).toHaveAttribute('aria-current', 'page')
  })

  it('moves the active state when the hash changes', async () => {
    render(<TopNav />)

    window.location.hash = '#api'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    await waitFor(() => {
      const api = screen.getAllByRole('link', { name: 'API' })[0]
      expect(api).toHaveAttribute('aria-current', 'page')
    })
    const features = screen.getAllByRole('link', { name: 'Features' })[0]
    expect(features).not.toHaveAttribute('aria-current')
  })

  it('opens the mobile menu and closes it with Escape', async () => {
    const user = userEvent.setup()
    render(<TopNav />)

    const toggle = screen.getByRole('button', { name: /open navigation menu/i })
    await user.click(toggle)

    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeVisible()
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('AuthHeader', () => {
  it('reuses the same navbar with login links, status and docs', () => {
    render(<AuthHeader />)

    expect(screen.getByRole('link', { name: 'SLA Monitor' })).toHaveAttribute('href', '#top')
    expect(screen.getByRole('navigation', { name: 'Primary' })).toHaveTextContent('Home')
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Docs' })).toBeInTheDocument()
  })
})
