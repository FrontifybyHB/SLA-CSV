import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useSession } from '../hooks/useSession'
import { isApiError } from '@/shared/api/api-error'

interface DashboardLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
}

/**
 * Auth-aware link to the dashboard.
 *
 * - Authenticated (session probe 200, refresh handled by the API kernel):
 *   points at /dashboard.
 * - Unauthenticated (probe 401 = no session and no usable refresh token):
 *   points at /login so a logged-out visitor never lands on a guarded
 *   route just to be bounced back.
 * - Probe pending or non-auth failure (network blip): points at /dashboard
 *   and lets RequireAuth show its spinner / retry state instead of
 *   misdirecting to login.
 */
export function DashboardLink({ children, href: _href, ...rest }: DashboardLinkProps) {
  const session = useSession()

  let href = '/dashboard'
  if (session.isError && isApiError(session.error) && session.error.status === 401) {
    href = '/login'
  } else if (session.data) {
    href = '/dashboard'
  }

  return (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}
