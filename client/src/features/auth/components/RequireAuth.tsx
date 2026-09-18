import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Spinner } from '@/shared/ui/Spinner'
import { getErrorMessage, isApiError } from '@/shared/api/api-error'
import { useSession } from '../hooks/useSession'

interface RequireAuthProps {
  children: ReactNode
}

/**
 * Blocks rendering of protected routes without a valid session.
 *
 * - Pending: spinner (avoids flashing protected content or a login form).
 * - 401 from /auth/me: redirect to /login. No protected UI is ever rendered.
 * - Other errors (network/server): recoverable error state with retry,
 *   so a blip doesn't log the user out.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const session = useSession()

  if (session.isPending) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }} role="status" aria-label="Checking session">
        <Spinner />
      </div>
    )
  }

  if (session.isError) {
    const { error } = session
    if (isApiError(error) && error.status === 401) {
      return <Navigate to="/login" replace />
    }
    return (
      <div style={{ maxWidth: 560, margin: '3rem auto', padding: '0 1rem' }}>
        <ErrorState
          title="Could not verify your session."
          message={getErrorMessage(error)}
          onRetry={() => void session.refetch()}
          retryLabel="Retry"
        />
      </div>
    )
  }

  return <>{children}</>
}
