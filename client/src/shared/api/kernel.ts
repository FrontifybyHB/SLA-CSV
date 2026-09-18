import { getApiBase } from './api-base'
import { ApiError, isAbortError } from './api-error'
import { buildQueryString, type QueryValues } from './query-string'

export interface RequestControl {
  signal?: AbortSignal
  timeoutMs?: number
  headers?: HeadersInit
}

interface KernelRequest extends RequestControl {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  query?: QueryValues
  jsonBody?: unknown
  rawBody?: BodyInit
}

const AUTH_BASE = `${getApiBase()}/auth`
const REFRESH_ENDPOINT = `${AUTH_BASE}/refresh`
const EXPIRED_TOKEN_CODE = 'ACCESS_TOKEN_EXPIRED'

interface ErrorEnvelope {
  message?: unknown
  code?: unknown
  error?: { message?: unknown; code?: unknown }
  requestId?: unknown
}

const TIMEOUT_MARKER = 'request-timeout'

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

async function tryRefreshOnce(): Promise<void> {
  if (isRefreshing) {
    return refreshPromise!
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      // A failed refresh (expired refresh token, network blip) must reject:
      // previously the response was ignored, so callers retried the original
      // request with a still-expired cookie, surfaced a confusing 401, and
      // only the *next* manual call succeeded. Now the refresh error itself
      // propagates and no pointless retry happens.
      const response = await fetch(REFRESH_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw await toHttpError(response)
      }
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    throw new ApiError({
      kind: 'protocol',
      status: response.status,
      message: 'Server returned an empty response.',
    })
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ApiError({
      kind: 'protocol',
      status: response.status,
      message: 'Server returned a response that was not valid JSON.',
    })
  }
}

async function toHttpError(response: Response): Promise<ApiError> {
  const headerRequestId = response.headers.get('x-request-id') ?? undefined
  const body = await response.text()
  let message: string | undefined
  let code: string | undefined
  let envelopeRequestId: string | undefined

  if (body) {
    try {
      const parsed = JSON.parse(body) as ErrorEnvelope
      const detail = parsed && typeof parsed === 'object' ? parsed : undefined
      const inner = detail && detail.error && typeof detail.error === 'object' ? detail.error : detail
      if (inner && typeof inner.message === 'string') message = inner.message
      if (inner && typeof inner.code === 'string') code = inner.code
      if (detail && typeof detail.requestId === 'string') envelopeRequestId = detail.requestId
    } catch {
      // non-JSON error page; keep the generic status message
    }
  }

  return new ApiError({
    kind: 'http',
    status: response.status,
    code,
    message: message ?? `Request failed with status ${response.status}.`,
    requestId: envelopeRequestId ?? headerRequestId,
  })
}

export async function request<T>(init: KernelRequest): Promise<T> {
  const controller = new AbortController()
  const { signal: externalSignal, timeoutMs, headers: headerInit } = init
  let timedOut = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const onExternalAbort = (): void => {
    controller.abort(externalSignal?.reason)
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      onExternalAbort()
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true })
    }
  }

  if (timeoutMs !== undefined) {
    timer = setTimeout(() => {
      timedOut = true
      controller.abort(TIMEOUT_MARKER)
    }, timeoutMs)
  }

  const headers = new Headers(headerInit)
  if (init.jsonBody !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const url = init.query ? `${init.url}${buildQueryString(init.query)}` : init.url
  const body =
    init.jsonBody !== undefined ? JSON.stringify(init.jsonBody) : init.rawBody

  const cleanup = (): void => {
    if (timer !== undefined) clearTimeout(timer)
    if (externalSignal && !externalSignal.aborted) {
      externalSignal.removeEventListener('abort', onExternalAbort)
    }
  }

  let response: Response
  let hasRetried = false

  const doFetch = async (): Promise<Response> => {
    return fetch(url, {
      method: init.method,
      headers,
      body,
      signal: controller.signal,
      credentials: 'include',
    })
  }

  while (true) {
    try {
      response = await doFetch()
    } catch (error) {
      cleanup()
      if (isAbortError(error)) {
        if (timedOut) {
          throw new ApiError({
            kind: 'timeout',
            message: 'The request timed out.',
            cause: error,
          })
        }
        throw error
      }
      throw new ApiError({
        kind: 'network',
        message: 'Could not reach the server.',
        cause: error,
      })
    }

    if (response.ok) {
      cleanup()
      if (response.status === 204) {
        return undefined as T
      }
      return (await parseJson(response)) as T
    }

    const error = await toHttpError(response)

    if (
      !hasRetried &&
      response.status === 401 &&
      error.code === EXPIRED_TOKEN_CODE &&
      init.url !== REFRESH_ENDPOINT
    ) {
      hasRetried = true
      try {
        await tryRefreshOnce()
        continue
      } catch {
        cleanup()
        throw error
      }
    }

    cleanup()
    throw error
  }
}