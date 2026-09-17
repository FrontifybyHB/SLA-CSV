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

// sameSite 'lax' (not 'strict') so a post-login redirect navigating top-level still
// carries the cookie. If the frontend and backend ever move to different origins this
// must become 'none' + secure and explicit CSRF protection (double-submit token) is
// required — do not ship cross-origin cookies without it.
export class AuthCookieConfig {
  private readonly secure: boolean;

  constructor(secure = env.NODE_ENV === "production") {
    this.secure = secure;
  }

  private base(extra: Partial<CookieOptions>): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: "lax",
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