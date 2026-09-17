import { describe, expect, it } from 'vitest'
import { buildQueryString } from '@/shared/api/query-string'

describe('buildQueryString()', () => {
  it('omits null, undefined and empty strings', () => {
    expect(buildQueryString({ a: null, b: undefined, c: '', d: 'x' })).toBe('?d=x')
  })

  it('preserves meaningful false and zero', () => {
    expect(buildQueryString({ enabled: false, limit: 0 })).toBe('?enabled=false&limit=0')
  })

  it('returns an empty string for no values', () => {
    expect(buildQueryString({})).toBe('')
  })
})