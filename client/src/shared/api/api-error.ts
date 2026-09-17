export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'protocol'

export interface ApiErrorInit {
  kind: ApiErrorKind
  message: string
  status?: number
  code?: string
  requestId?: string
  cause?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly code: string | undefined
  readonly requestId: string | undefined

  constructor(init: ApiErrorInit) {
    super(init.message)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.code = init.code
    this.requestId = init.requestId
    if (init.cause !== undefined) {
      this.cause = init.cause
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error instanceof ApiError ||
      ((error as ApiError).name === 'ApiError' &&
        ((error as ApiError).kind === 'http' ||
          (error as ApiError).kind === 'network' ||
          (error as ApiError).kind === 'timeout' ||
          (error as ApiError).kind === 'protocol')))
  )
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name === 'AbortError'
  )
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function getErrorRequestId(error: unknown): string | undefined {
  return isApiError(error) ? error.requestId : undefined
}