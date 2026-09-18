export interface AppRuntimeConfig {
  apiBase?: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppRuntimeConfig
  }
}

/** Runtime config injected by the server via /config.js (production monolith). */
export function readRuntimeConfig(): AppRuntimeConfig | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.__APP_CONFIG__
}
