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
    try {
      const user = await this.userRepository.create({
        email: normalizedEmail,
        passwordHash,
      });
      return this.issueTokens(user);
    } catch (err) {
      // Check-then-insert race (concurrent double-register): the UNIQUE
      // constraint on users.email fires with pg code 23505. Map it to the
      // same generic 400 as the pre-check so no raw DB error leaks.
      if (isUniqueViolation(err)) {
        throw new AuthenticationError(GENERIC_REGISTER_MESSAGE, "REGISTRATION_FAILED", 400);
      }
      throw err;
    }
  }

  async login(email: string, password: string): Promise<AuthSessionResult> {
    const normalizedEmail = normalizeEmail(email);

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      // Timing mitigation: a nonexistent user must cost the same ~bcrypt
      // compare as a wrong password, or response time alone reveals which
      // emails are registered despite the generic error message.
      await this.passwordHasher.verify(password, await dummyHash(this.passwordHasher));
      throw new AuthenticationError(GENERIC_LOGIN_MESSAGE, "INVALID_CREDENTIALS", 401);
    }

    const passwordValid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!passwordValid) {
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
    const newId = await this.refreshTokenRepository.rotate(record.id, {
      userId: user.id,
      tokenHash: fresh.tokenHash,
      expiresAt: fresh.expiresAt,
    });

    if (newId) {
      return {
        accessToken: this.tokenService.signAccessToken(user.id, user.role),
        refreshToken: fresh.token,
      };
    }

    // Lost a concurrent rotation race: the winner already linked itself via
    // replaced_by — follow the chain instead of minting a second branch.
    const current = await this.refreshTokenRepository.findById(record.id);
    if (current?.replacedBy) {
      const replacement = await this.refreshTokenRepository.findById(current.replacedBy);
      if (
        replacement &&
        replacement.userId === record.userId &&
        !replacement.revokedAt &&
        replacement.expiresAt.getTime() > Date.now()
      ) {
        return this.rotate(replacement);
      }
    }
    throw new AuthenticationError(GENERIC_REFRESH_MESSAGE, REFRESH_CODE, 401);
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

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "23505"
  );
}

// Lazily-created, cached bcrypt hash used only for the dummy compare on
// unknown emails. Generated once per process so steady-state login timing
// stays uniform without paying hash() on every request.
let cachedDummyHash: Promise<string> | null = null;

function dummyHash(hasher: PasswordHasher): Promise<string> {
  if (!cachedDummyHash) {
    cachedDummyHash = hasher.hash("timing-mitigation-dummy-value");
  }
  return cachedDummyHash;
}