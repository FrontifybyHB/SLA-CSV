import { afterEach, describe, expect, it, vi } from 'vitest'
import { getReportingLogs, getReportingSlots, getReportingStats } from '@/features/reporting'

function stubFetch(body: unknown): ReturnType<typeof vi.fn> {
  const mock = vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    text: async () => JSON.stringify({ success: true, data: body }),
  }))
  vi.stubGlobal('fetch', mock)
  return mock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const RANGE = { startDate: '2026-09-01T00:00:00.000Z', endDate: '2026-09-15T00:00:00.000Z' }

describe('reporting api', () => {
  it('always sends startDate+endDate (the server rejects date-less calls)', async () => {
    const fetchMock = stubFetch({ totalSlots: 0 })
    await getReportingStats('ds-1', RANGE)
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('/api/v1/reporting/stats')
    expect(url).toContain('datasetId=ds-1')
    expect(url).toContain('startDate=')
    expect(url).toContain('endDate=')
  })

  it('sends pagination for logs and slots', async () => {
    const fetchMock = stubFetch({ observations: [], total: 0, page: 2, pageSize: 10 })
    await getReportingLogs('ds-1', RANGE, 2, 10)
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('page=2')
    expect(url).toContain('pageSize=10')

    const fetchMock2 = stubFetch({ slots: [], total: 0, page: 1, pageSize: 100 })
    await getReportingSlots('ds-1', RANGE, 1, 100)
    expect(String(fetchMock2.mock.calls[0][0])).toContain('/api/v1/reporting/slots')
  })
})
