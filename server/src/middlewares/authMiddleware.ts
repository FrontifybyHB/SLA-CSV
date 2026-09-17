/* eslint-disable @typescript-eslint/no-namespace */
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { ACCESS_TOKEN_COOKIE } from "../config/cookieConfig.js";
import { ExpiredTokenError, InvalidTokenError } from "../errors/tokenErrors.js";
import { AuthenticationError } from "./appError.js";
import type { TokenService } from "../services/tokenService.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export class AuthMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  requireAuth(): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
      if (!token) {
        next(new AuthenticationError("Authentication required", "UNAUTHORIZED", 401));
        return;
      }

      try {
        const payload = this.tokenService.verifyAccessToken(token);
        req.user = { id: payload.sub, role: payload.role };
        next();
      } catch (err) {
        if (err instanceof ExpiredTokenError) {
          next(
            new AuthenticationError(
              "Access token expired",
              "ACCESS_TOKEN_EXPIRED",
              401,
            ),
          );
          return;
        }
        if (err instanceof InvalidTokenError) {
          next(new AuthenticationError("Invalid access token", "UNAUTHORIZED", 401));
          return;
        }
        next(err as Error);
      }
    };
  }
}