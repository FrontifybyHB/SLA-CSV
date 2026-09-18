import type {
  AuthSessionResult,
  RefreshTokenRecord,
  TokenPair,
  UserRecord,
} from "../contracts/auth.js";
import {
  toPublicUser,
  type IRefreshTokenRepository,
  type IUserRepository,
} from "../contracts/auth.repository.interface.js";
import { MIN_PASSWORD_LENGTH } from "../contracts/auth.js";
import { AuthenticationError } from "../middlewares/appError.js";
import logger from "../middlewares/logger.js";
import { PasswordHasher } from "./passwordHasher.js";
import { TokenService } from "./tokenService.js";

const GENERIC_LOGIN_MESSAGE = "Invalid email or password";
const GENERIC_REGISTER_MESSAGE = "Registration failed";
const GENERIC_REFRESH_MESSAGE = "Invalid refresh token";
const REFRESH_CODE = "INVALID_REFRESH_TOKEN";
// A replay of a just-rotated token is overwhelmingly a benign concurrent
// duplicate (two queries expiring at once, StrictMode remount, two tabs) —
// not theft. Only treat replays older than this as theft.
// Reduced from 60s to 5s to minimize token reuse attack window.
const REFRESH_REUSE_GRACE_MS = 5_000;

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async register(email: string, password: string): Promise<AuthSessionResult> {
    const normalizedEmail = normalizeEmail(email);

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AuthenticationError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        "PASSWORD_POLICY",
        400,
      );
    }

    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new AuthenticationError(GENERIC_REGISTER_MESSAGE, "REGISTRATION_FAILED", 400);
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
    });

    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthSessionResult> {
    const normalizedEmail = normalizeEmail(email);

    const user = await this.userRepository.findByEmail(normalizedEmail);
    const passwordValid =
      user !== null && (await this.passwordHasher.verify(password, user.passwordHash));

    if (!user || !passwordValid) {
      throw new AuthenticationError(GENERIC_LOGIN_MESSAGE, "INVALID_CREDENTIALS", 401);
    }

    return this.issueTokens(user);
  }

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    if (!rawRefreshToken) {
      throw new AuthenticationError(GENERIC_REFRESH_MESSAGE, REFRESH_CODE, 401);
    }

    const tokenHash = this.tokenService.hashToken(rawRefreshToken);

    const valid = await this.refreshTokenRepository.findValidByHash(tokenHash);
    if (valid) {
      return this.rotate(valid);
    }

    // findValidByHash excluded the row (expired OR revoked). Distinguish a
    // benign concurrent replay from theft: a revoked token that was rotated
    // moments ago (replaced_by set, revoked within the grace window) means a
    // duplicate in-flight refresh — rotate the live replacement forward so
    // every racer converges on a valid token family instead of nuking the
    // user's sessions. Anything older is presumed theft.
    const found = await this.refreshTokenRepository.findByHash(tokenHash);
    if (found && found.revokedAt && found.replacedBy) {
      const rotatedAgoMs = Date.now() - found.revokedAt.getTime();
      if (rotatedAgoMs <= REFRESH_REUSE_GRACE_MS) {
        const replacement = await this.refreshTokenRepository.findById(found.replacedBy);
        if (
          replacement &&
          replacement.userId === found.userId &&
          !replacement.revokedAt &&
          replacement.expiresAt.getTime() > Date.now()
        ) {
          logger.info("Duplicate refresh within grace window; rotating forward", {
            userId: found.userId,
            tokenId: found.id,
          });
          return this.rotate(replacement);
        }
      }
      logger.warn("Suspected refresh token reuse; revoking all sessions", {
        userId: found.userId,
        tokenId: found.id,
        discardedTokenId: found.replacedBy,
      });
      await this.refreshTokenRepository.revokeAllForUser(found.userId);
      throw new AuthenticationError(GENERIC_REFRESH_MESSAGE, REFRESH_CODE, 401);
    }

    throw new AuthenticationError(GENERIC_REFRESH_MESSAGE, REFRESH_CODE, 401);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const found = await this.refreshTokenRepository.findByHash(tokenHash);
    if (found && !found.revokedAt) {
      await this.refreshTokenRepository.revoke(found.id);
    }
  }

  private async rotate(record: RefreshTokenRecord): Promise<TokenPair> {
    const user = await this.userRepository.findById(record.userId);
    if (!user) {
      throw new AuthenticationError(GENERIC_REFRESH_MESSAGE, REFRESH_CODE, 401);
    }

    const fresh = this.tokenService.signRefreshToken(user.id);
    const newId = await this.refreshTokenRepository.store({
      userId: user.id,
      tokenHash: fresh.tokenHash,
      expiresAt: fresh.expiresAt,
    });
    await this.refreshTokenRepository.markReplaced(record.id, newId);

    return {
      accessToken: this.tokenService.signAccessToken(user.id, user.role),
      refreshToken: fresh.token,
    };
  }

  private async issueTokens(user: UserRecord): Promise<AuthSessionResult> {
    const accessToken = this.tokenService.signAccessToken(user.id, user.role);
    const refresh = this.tokenService.signRefreshToken(user.id);
    await this.refreshTokenRepository.store({
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
    });

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken: refresh.token,
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}