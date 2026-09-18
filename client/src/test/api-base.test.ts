import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getApiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete window.__APP_CONFIG__
    vi.resetModules()
  })

  it('defaults to same-origin /api/v1 when no config is set', async () => {
    vi.stubEnv('VITE_API_BASE', '')
    const { getApiBase } = await import('@/shared/api/api-base')
    expect(getApiBase()).toBe('/api/v1')
  })

  it('prefers runtime config from /config.js over build-time env', async () => {
    vi.stubEnv('VITE_API_BASE', 'https://build.example.com/api/v1')
    window.__APP_CONFIG__ = { apiBase: 'https://runtime.example.com/api/v1/' }
    vi.resetModules()
    const { getApiBase } = await import('@/shared/api/api-base')
    expect(getApiBase()).toBe('https://runtime.example.com/api/v1')
  })

  it('uses VITE_API_BASE in dev when runtime config is absent', async () => {
    vi.stubEnv('VITE_API_BASE', 'https://api.example.com/api/v1/')
    vi.stubEnv('DEV', true)
    vi.resetModules()
    const { getApiBase } = await import('@/shared/api/api-base')
    expect(getApiBase()).toBe('https://api.example.com/api/v1')
  })

  it('ignores VITE_API_BASE in production builds', async () => {
    vi.stubEnv('VITE_API_BASE', 'http://localhost:3000/api/v1')
    vi.stubEnv('DEV', false)
    vi.resetModules()
    const { getApiBase } = await import('@/shared/api/api-base')
    expect(getApiBase()).toBe('/api/v1')
  })
})
