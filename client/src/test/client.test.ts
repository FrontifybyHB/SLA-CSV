import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'

function mockResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  }
}

function stubFetch(body: unknown = {}): ReturnType<typeof vi.fn> {
  const mock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    void url
    return mockResponse(200, body)
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

function getPathFromUrl(url: string | URL): string {
  const u = typeof url === 'string' ? new URL(url) : url
  return u.pathname + u.search
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('api client', () => {
  it('builds requests against the versioned base path', async () => {
    const fetchMock = stubFetch({ datasets: [] })
    await api.get('/datasets', { cursor: null, limit: 50 })
    expect(getPathFromUrl(fetchMock.mock.calls[0][0])).toBe('/api/v1/datasets?limit=50')
  })

  it('uploads a file as raw bytes with a CSV content type', async () => {
    const fetchMock = stubFetch({ datasetId: 'ds-1' })
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' })
    const result = await api.upload('/datasets', file)

    const [url, init] = fetchMock.mock.calls[0]
    // The server rejects uploads without a filename, so the client must
    // transmit it both as a query param and as an x-filename header.
    expect(getPathFromUrl(url)).toBe('/api/v1/datasets?filename=data.csv')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(file)
    expect(init.headers.get('content-type')).toBe('text/csv')
    expect(init.headers.get('x-filename')).toBe('data.csv')
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(result).toEqual({ datasetId: 'ds-1' })
  })
})