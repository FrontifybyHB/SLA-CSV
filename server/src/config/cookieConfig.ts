import type { CookieOptions } from "express";

import env from "./env.js";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// On rotation the refresh cookie is cleared and re-set; clearing must match the set
// path exactly, so each refresh-cookie path is tracked here.
const REFRESH_TOKEN_PATHS = ["/api/v1/auth/refresh", "/api/v1/auth/logout"];

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthCookie {
  name: string;
  value: string;
  options: CookieOptions;
}

// sameSite defaults to 'lax' in dev (CSRF-safe, top-level redirects work).
// In production with a cross-origin frontend it becomes 'none' + secure via
// COOKIE_SAME_SITE/COOKIE_SECURE so the browser actually sends the session
// cookies. Cross-origin + SameSite=None needs CSRF protection
// (double-submit token) — do not ship cross-origin cookies without it.
export class AuthCookieConfig {
  private readonly secure: boolean;
  private readonly sameSite: "lax" | "none" | "strict";

  constructor(secure = env.COOKIE_SECURE, sameSite = env.COOKIE_SAME_SITE) {
    this.secure = secure;
    this.sameSite = sameSite;
  }

  private base(extra: Partial<CookieOptions>): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      ...extra,
    };
  }

  accessToken(value: string): AuthCookie {
    return {
      name: ACCESS_TOKEN_COOKIE,
      value,
      options: this.base({ path: "/", maxAge: ACCESS_TOKEN_MAX_AGE_MS }),
    };
  }

  refreshToken(value: string): AuthCookie[] {
    return REFRESH_TOKEN_PATHS.map((path) => ({
      name: REFRESH_TOKEN_COOKIE,
      value,
      options: this.base({ path, maxAge: REFRESH_TOKEN_MAX_AGE_MS }),
    }));
  }

  accessTokenClear(): AuthCookie {
    return { name: ACCESS_TOKEN_COOKIE, value: "", options: this.base({ path: "/" }) };
  }

  refreshTokenClear(): AuthCookie[] {
    return REFRESH_TOKEN_PATHS.map((path) => ({
      name: REFRESH_TOKEN_COOKIE,
      value: "",
      options: this.base({ path }),
    }));
  }
}