import type { NextFunction, Request, Response } from "express";

import type { AuthService } from "../services/authService.js";
import {
  AuthCookieConfig,
  REFRESH_TOKEN_COOKIE,
} from "../config/cookieConfig.js";
import { AuthenticationError } from "../middlewares/appError.js";
import { sendSuccess } from "../utils/apiResponse.js";

interface CredentialsInput {
  email: string;
  password: string;
}

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieConfig: AuthCookieConfig,
  ) {}

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = this.credentials(req);
      const session = await this.authService.register(email, password);
      this.setSessionCookies(res, session.accessToken, session.refreshToken);
      sendSuccess(res, {
        statusCode: 201,
        message: "User registered successfully",
        data: { user: session.user },
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, password } = this.credentials(req);
      const session = await this.authService.login(email, password);
      this.setSessionCookies(res, session.accessToken, session.refreshToken);
      sendSuccess(res, {
        statusCode: 200,
        message: "Login successful",
        data: { user: session.user },
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
      if (!token) {
        next(
          new AuthenticationError("Missing refresh token", "INVALID_REFRESH_TOKEN", 401),
        );
        return;
      }
      const tokens = await this.authService.refresh(token);
      this.setSessionCookies(res, tokens.accessToken, tokens.refreshToken);
      sendSuccess(res, {
        statusCode: 200,
        message: "Token refreshed successfully",
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
      await this.authService.logout(token ?? "");
      this.clearSessionCookies(res);
      sendSuccess(res, {
        statusCode: 200,
        message: "Logout successful",
      });
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new AuthenticationError("Authentication required", "UNAUTHORIZED", 401));
        return;
      }
      sendSuccess(res, {
        statusCode: 200,
        message: "Session retrieved successfully",
        data: { user: req.user },
      });
    } catch (err) {
      next(err);
    }
  };

  private credentials(req: Request): CredentialsInput {
    const body = (req.validated?.body ?? req.body) as Partial<CredentialsInput>;
    return {
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
    };
  }

  private setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const access = this.cookieConfig.accessToken(accessToken);
    res.cookie(access.name, access.value, access.options);
    for (const cookie of this.cookieConfig.refreshToken(refreshToken)) {
      res.cookie(cookie.name, cookie.value, cookie.options);
    }
  }

  private clearSessionCookies(res: Response): void {
    const access = this.cookieConfig.accessTokenClear();
    res.clearCookie(access.name, access.options);
    for (const cookie of this.cookieConfig.refreshTokenClear()) {
      res.clearCookie(cookie.name, cookie.options);
    }
  }
}