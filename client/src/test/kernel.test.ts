import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, isAbortError } from '@/shared/api/api-error'
import { request } from '@/shared/api/kernel'
import type { QueryValues } from '@/shared/api/query-string'

interface HeadersLike {
  get: (name: string) => string | null
}

function mockResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): { ok: boolean; status: number; headers: HeadersLike; text: () => Promise<string> } {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

function abortError(message = 'The operation was aborted'): Error {
  const error = new Error(message)
  error.name = 'AbortError'
  return error
}

type FetchStub = (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>

function stubFetch(impl: FetchStub): ReturnType<typeof vi.fn> {
  const mock = vi.fn(impl)
  vi.stubGlobal('fetch', mock)
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('request()', () => {
  it('resolves parsed JSON on success', async () => {
    stubFetch(async () => mockResponse(200, { ok: true, rows: 3 }))
    await expect(
      request({ method: 'GET', url: '/things' }),
    ).resolves.toEqual({ ok: true, rows: 3 })
  })

  it('maps a 204 to undefined', async () => {
    stubFetch(async () => mockResponse(204, null))
    await expect(request({ method: 'GET', url: '/things' })).resolves.toBeUndefined()
  })

  it('turns a non-JSON error page into an ApiError without exposing HTML', async () => {
    stubFetch(async () =>
      mockResponse(502, '<html><body>Bad Gateway</body></html>', { 'x-request-id': 'req-42' }),
    )
    const pending = request({ method: 'GET', url: '/things' })
    await expect(pending).rejects.toBeInstanceOf(ApiError)
    await expect(pending).rejects.toMatchObject({
      kind: 'http',
      status: 502,
      requestId: 'req-42',
    })
    await expect(pending).rejects.toThrow(/502/)
    await expect(pending).rejects.not.toThrow(/<html/)
  })

  it('extracts message, code and requestId from an error envelope', async () => {
    stubFetch(async () =>
      mockResponse(422, {
        error: { message: 'Invalid date range', code: 'INVALID_DATE_RANGE' },
        requestId: 'req-7',
      }),
    )
    const pending = request({ method: 'GET', url: '/things' })
    await expect(pending).rejects.toMatchObject({
      kind: 'http',
      status: 422,
      code: 'INVALID_DATE_RANGE',
      message: 'Invalid date range',
      requestId: 'req-7',
    })
  })

  it('preserves an intentional abort as a cancellation, not an ApiError', async () => {
    stubFetch(async (_input, init) => {
      if (init?.signal?.aborted) throw abortError()
      return mockResponse(200, {})
    })
    const controller = new AbortController()
    controller.abort()
    const pending = request({ method: 'GET', url: '/things', signal: controller.signal })
    await expect(pending).rejects.toSatisfy(
      (error: unknown) => isAbortError(error) && !(error instanceof ApiError),
    )
  })

  it('reports a timeout as an ApiError with kind timeout', async () => {
    stubFetch(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(abortError()),
            { once: true },
          )
        }),
    )
    const pending = request({ method: 'GET', url: '/things', timeoutMs: 20 })
    await expect(pending).rejects.toMatchObject({ kind: 'timeout' })
  })

  it('maps a network rejection to an ApiError with kind network', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed')
    })
    const pending = request({ method: 'GET', url: '/things' })
    await expect(pending).rejects.toMatchObject({ kind: 'network' })
  })

  it('encodes a JSON body and sets the content type', async () => {
    const fetchMock = stubFetch(async () => mockResponse(200, {}))
    await request({ method: 'POST', url: '/things', jsonBody: { a: 1 } })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.get('content-type')).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ a: 1 }))
  })

  it('sends a raw file body untouched', async () => {
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' })
    const fetchMock = stubFetch(async () => mockResponse(200, {}))
    await request({
      method: 'POST',
      url: '/things',
      rawBody: file,
      headers: { 'content-type': 'text/csv' },
    })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBe(file)
    expect(init.headers.get('content-type')).toBe('text/csv')
  })

  it('serializes query params while omitting absent values', async () => {
    const fetchMock = stubFetch(async () => mockResponse(200, {}))
    const query: QueryValues = { cursor: null, limit: 50, active: false, name: '' }
    await request({ method: 'GET', url: '/things', query })
    expect(fetchMock.mock.calls[0][0]).toBe('/things?limit=50&active=false')
  })
})