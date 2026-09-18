import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getApiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to same-origin /api/v1 when VITE_API_BASE is unset', async () => {
    vi.stubEnv('VITE_API_BASE', '')
    const { getApiBase } = await import('@/shared/api/api-base')
    expect(getApiBase()).toBe('/api/v1')
  })

  it('uses VITE_API_BASE when configured', async () => {
    vi.stubEnv('VITE_API_BASE', 'https://api.example.com/api/v1/')
    vi.resetModules()
    const { getApiBase } = await import('@/shared/api/api-base')
    expect(getApiBase()).toBe('https://api.example.com/api/v1')
  })
})
