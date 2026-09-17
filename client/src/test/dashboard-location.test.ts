import { describe, expect, it } from 'vitest'
import {
  parseDashboardSearch,
  serializeDashboardSearch,
  emptyDashboardSearch,
} from '@/pages/dashboard/dashboard-location'

describe('dashboard location', () => {
  it('drops invalid values to a recoverable null state', () => {
    const parsed = parseDashboardSearch('?dataset=%20bad%20id&from=2026-13-40&service=api')
    expect(parsed.dataset).toBeNull()
    expect(parsed.from).toBeNull()
    expect(parsed.service).toBe('api')
  })

  it('round-trips valid values', () => {
    const params = {
      ...emptyDashboardSearch,
      dataset: 'ds-1',
      from: '2026-09-01',
      to: '2026-09-15',
    }
    expect(parseDashboardSearch(serializeDashboardSearch(params))).toEqual(params)
  })

  it('serializes an empty selection to an empty string', () => {
    expect(serializeDashboardSearch(emptyDashboardSearch)).toBe('')
  })
})