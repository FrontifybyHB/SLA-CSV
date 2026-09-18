import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '@/features/auth/api/auth.api'
import type { DashboardHeaderLink } from '@/shared/ui/DashboardHeader'

/**
 * Single source of truth for dashboard navigation.
 * Every dashboard page imports this — no per-page NAV_LINKS clones.
 */
export const DASHBOARD_NAV_LINKS: DashboardHeaderLink[] = [
  { label: 'Overview', to: '/dashboard' },
  { label: 'Datasets', to: '/dashboard/dataset' },
  { label: 'Breach logs', to: '/dashboard/breaches' },
]

/**
 * Single shared sign-out flow (clear cache → login).
 * Replaces 3 copy-pasted handleSignOut implementations.
 */
export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const signOut = useCallback(async () => {
    setSigningOut(true)
    try {
      await logout()
    } catch {
      // Drop local state and leave even if the server call fails.
    } finally {
      queryClient.clear()
      navigate('/login', { replace: true })
    }
  }, [navigate, queryClient])

  return { signOut, signingOut }
}
