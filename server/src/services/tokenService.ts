import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

import type { AccessTokenPayload, RefreshTokenSignResult } from "../contracts/auth.js";
import { ExpiredTokenError, InvalidTokenError } from "../errors/tokenErrors.js";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export class TokenService {
  constructor(
    private readonly accessTokenSecret: string,
    private readonly refreshTokenSecret: string,
  ) {}

  signAccessToken(userId: string, role: string): string {
    return jwt.sign({ role }, this.accessTokenSecret, {
      subject: userId,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  signRefreshToken(userId: string): RefreshTokenSignResult {
    const token = jwt.sign({}, this.refreshTokenSecret, {
      subject: userId,
      jwtid: randomUUID(),
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });

    return {
      token,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as jwt.JwtPayload;
      if (typeof payload.sub !== "string" || typeof payload.role !== "string") {
        throw new InvalidTokenError();
      }
      return { sub: payload.sub, role: payload.role };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new ExpiredTokenError();
      }
      if (err instanceof ExpiredTokenError || err instanceof InvalidTokenError) {
        throw err;
      }
      throw new InvalidTokenError();
    }
  }

  hashToken(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }
}