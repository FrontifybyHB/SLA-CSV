import env from "./env.js";

const DEFAULT_API_BASE = "/api/v1";

/** Normalize API base: no trailing slash; same-origin default for monolith deploys. */
export function normalizeApiBase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_API_BASE;
  }
  return trimmed.replace(/\/+$/, "");
}

export function getPublicApiBase(): string {
  return normalizeApiBase(env.API_BASE_URL);
}

/** CSP connect-src entries when the API is hosted on another origin. */
export function getApiConnectSrcOrigins(): string[] {
  const base = getPublicApiBase();
  if (!/^https?:\/\//i.test(base)) {
    return [];
  }
  try {
    return [new URL(base).origin];
  } catch {
    return [];
  }
}

export function getPublicRuntimeConfig(): { apiBase: string } {
  return { apiBase: getPublicApiBase() };
}
