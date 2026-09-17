import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/api/api-error'

const RETRYABLE_STATUSES = new Set([502, 503, 504])
const MAX_RETRIES = 1

export function retryTransientReadOnce(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false
  if (!isApiError(error)) return false
  if (error.kind === 'network') return true
  if (error.kind === 'http' && error.status !== undefined && RETRYABLE_STATUSES.has(error.status)) {
    return true
  }
  return false
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: retryTransientReadOnce,
        refetchOnWindowFocus: false,
        gcTime: 10 * 60 * 1000,
      },
    },
  })
}

export const queryClient = createQueryClient()