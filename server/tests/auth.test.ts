import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";

import type { PublicUser, RefreshTokenRecord, UserRecord } from "../src/contracts/auth.js";
import type {
  IRefreshTokenRepository,
  IUserRepository,
  StoreRefreshTokenInput,
} from "../src/contracts/auth.repository.interface.js";
import { AuthService } from "../src/services/authService.js";
import { AuthMiddleware } from "../src/middlewares/authMiddleware.js";
import { PasswordHasher } from "../src/services/passwordHasher.js";
import { TokenService } from "../src/services/tokenService.js";
import { AuthenticationError } from "../src/middlewares/appError.js";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../src/config/cookieConfig.js";

const ACCESS_SECRET = "test-access-secret";
const REFRESH_SECRET = "test-refresh-secret";

class FakeUserRepository implements IUserRepository {
  private readonly byId = new Map<string, UserRecord>();
  private readonly byEmail = new Map<string, UserRecord>();
  private nextId = 1;

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.byEmail.get(email) ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async create(input: { email: string; passwordHash: string }): Promise<UserRecord> {
    const user: UserRecord = {
      id: `user-${this.nextId++}`,
      email: input.email,
      role: "user",
      passwordHash: input.passwordHash,
      createdAt: new Date(),
    };
    this.byId.set(user.id, user);
    this.byEmail.set(user.email, user);
    return user;
  }
}

class FakeRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly rows = new Map<string, RefreshTokenRecord>();
  private readonly byHash = new Map<string, string>();
  private nextId = 1;

  async store(input: StoreRefreshTokenInput): Promise<string> {
    const id = `refresh-token-${this.nextId++}`;
    const row: RefreshTokenRecord = {
      id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedBy: null,
      createdAt: new Date(),
    };
    this.rows.set(id, row);
    this.byHash.set(input.tokenHash, id);
    return id;
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const id = this.byHash.get(tokenHash);
    if (!id) {
      return null;
    }
    return this.rows.get(id) ?? null;
  }

  async findValidByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const row = await this.findByHash(tokenHash);
    if (!row || row.revokedAt) {
      return null;
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return row;
  }

  async findById(id: string): Promise<RefreshTokenRecord | null> {
    return this.rows.get(id) ?? null;
  }

  async revoke(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row && !row.revokedAt) {
      row.revokedAt = new Date();
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const row of this.rows.values()) {
      if (row.userId === userId && !row.revokedAt) {
        row.revokedAt = new Date();
      }
    }
  }

  async markReplaced(oldId: string, newId: string): Promise<void> {
    const row = this.rows.get(oldId);
    if (row) {
      row.revokedAt = new Date();
      row.replacedBy = newId;
    }
  }

  async rotate(oldId: string, input: StoreRefreshTokenInput): Promise<string | null> {
    const row = this.rows.get(oldId);
    if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    const newId = await this.store(input);
    row.revokedAt = new Date();
    row.replacedBy = newId;
    return newId;
  }

  async allRows(): Promise<RefreshTokenRecord[]> {
    return Array.from(this.rows.values());
  }
}

interface TestHarness {
  authService: AuthService;
  tokenService: TokenService;
  refreshTokens: FakeRefreshTokenRepository;
}

function buildHarness(): TestHarness {
  const refreshTokens = new FakeRefreshTokenRepository();
  const tokenService = new TokenService(ACCESS_SECRET, REFRESH_SECRET);
  const authService = new AuthService(
    new FakeUserRepository(),
    refreshTokens,
    new PasswordHasher(4),
    tokenService,
  );
  return { authService, tokenService, refreshTokens };
}

async function captureError(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (err) {
    return err as Error;
  }
  throw new Error("Expected the promise to reject");
}

function runMiddleware(
  handler: RequestHandler,
  cookies: Record<string, string>,
): { req: Partial<Request> & { cookies?: Record<string, string>; user?: unknown }; captured: unknown } {
  const req = { cookies };
  let captured: unknown = null;
  handler(
    req as Request,
    {} as Response,
    (err?: unknown) => {
      captured = err ?? null;
    },
  );
  return { req, captured };
}

// Test 1: register() rejects a duplicate email with a generic message that does not
// reveal the email exists.
test("1. register() rejects a duplicate email with a generic message", async () => {
  const { authService } = buildHarness();
  await authService.register("alice@example.com", "password123");

  const err = await captureError(() =>
    authService.register("alice@example.com", "password123"),
  );

  assert.ok(err instanceof AuthenticationError);
  assert.equal(err.message, "Registration failed");
  assert.ok(
    !err.message.toLowerCase().includes("exist"),
    "Message must not hint that the email is already registered",
  );
});

// Test 2: wrong password and nonexistent email are indistinguishable.
test("2. login() with wrong password and with nonexistent email return identical errors", async () => {
  const { authService } = buildHarness();
  await authService.register("alice@example.com", "password123");

  const missingUser = await captureError(() =>
    authService.login("ghost@example.com", "whatever123"),
  );
  const wrongPassword = await captureError(() =>
    authService.login("alice@example.com", "wrong-password"),
  );

  assert.ok(missingUser instanceof AuthenticationError);
  assert.ok(wrongPassword instanceof AuthenticationError);
  assert.equal(missingUser.message, wrongPassword.message);
  assert.equal(missingUser.statusCode, wrongPassword.statusCode);
});

// Test 3: AuthMiddleware behavior for valid / expired / missing / invalid tokens.
test("3. AuthMiddleware attaches req.user for a valid token and returns ACCESS_TOKEN_EXPIRED for an expired one", async () => {
  const { tokenService } = buildHarness();
  const middleware = new AuthMiddleware(tokenService);
  const handler = middleware.requireAuth();

  // Valid token => req.user populated.
  const validToken = tokenService.signAccessToken("user-1", "user");
  const valid = runMiddleware(handler, { [ACCESS_TOKEN_COOKIE]: validToken });
  assert.equal(valid.captured, null);
  assert.deepEqual(valid.req.user, { id: "user-1", role: "user" });

  // Expired token => 401 with a machine-readable ACCESS_TOKEN_EXPIRED code.
  const expiredToken = jwt.sign(
    { role: "user" },
    ACCESS_SECRET,
    { subject: "user-1", expiresIn: -10 },
  );
  const expired = runMiddleware(handler, { [ACCESS_TOKEN_COOKIE]: expiredToken });
  assert.ok(expired.captured instanceof AuthenticationError);
  assert.equal((expired.captured as AuthenticationError).statusCode, 401);
  assert.equal((expired.captured as AuthenticationError).code, "ACCESS_TOKEN_EXPIRED");

  // Missing cookie => 401 UNAUTHORIZED.
  const missing = runMiddleware(handler, {});
  assert.ok(missing.captured instanceof AuthenticationError);
  assert.equal((missing.captured as AuthenticationError).statusCode, 401);
  assert.equal((missing.captured as AuthenticationError).code, "UNAUTHORIZED");

  // Garbage token => 401 UNAUTHORIZED.
  const garbage = runMiddleware(handler, { [ACCESS_TOKEN_COOKIE]: "garbage-not-a-jwt" });
  assert.ok(garbage.captured instanceof AuthenticationError);
  assert.equal((garbage.captured as AuthenticationError).statusCode, 401);
  assert.equal((garbage.captured as AuthenticationError).code, "UNAUTHORIZED");
});

// Test 4: refresh() rotates the token and revokes the old row.
test("4. refresh() with a valid token issues new tokens and revokes the old refresh row", async () => {
  const { authService, tokenService, refreshTokens } = buildHarness();
  const session = await authService.register("alice@example.com", "password123");

  const oldHash = tokenService.hashToken(session.refreshToken);
  const oldRow = await refreshTokens.findValidByHash(oldHash);
  assert.ok(oldRow, "Initial refresh token should be stored and valid");

  const tokens = await authService.refresh(session.refreshToken);

  assert.ok(tokens.accessToken.length > 0);
  assert.notEqual(tokens.refreshToken, session.refreshToken);

  // Old row must now be revoked and chained to the replacement.
  const rotated = await refreshTokens.findByHash(oldHash);
  assert.ok(rotated);
  assert.ok(rotated.revokedAt, "Old refresh row must be revoked");
  assert.ok(rotated.replacedBy, "Old refresh row must point at its replacement");

  const newRow = await refreshTokens.findByHash(
    tokenService.hashToken(tokens.refreshToken),
  );
  assert.ok(newRow);
  assert.equal(newRow.revokedAt, null);
  assert.equal(newRow.userId, session.user.id);
});

// Test 5: replaying an already-rotated token *within the grace window* is a benign
// concurrent duplicate (two queries expiring at once, StrictMode remount, …) — it
// rotates forward and keeps every session alive. Only a replay *after* the grace
// window is treated as theft and revokes every other active session.
test("5. refresh() with a concurrently-replayed token rotates forward; aged replay revokes all sessions", async () => {
  const { authService, tokenService, refreshTokens } = buildHarness();
  const firstSession = await authService.register("alice@example.com", "password123");
  const secondSession = await authService.login("alice@example.com", "password123");

  // Rotate the first token legitimately.
  const rotated = await authService.refresh(firstSession.refreshToken);

  // Immediate replay = concurrent duplicate: must succeed, not nuke sessions.
  const forwarded = await authService.refresh(firstSession.refreshToken);
  assert.ok(forwarded.accessToken.length > 0);
  assert.ok(forwarded.refreshToken.length > 0);

  const second = await refreshTokens.findByHash(
    tokenService.hashToken(secondSession.refreshToken),
  );
  assert.equal(second?.revokedAt, null, "Other active session must survive a grace-window replay");

  // The newest token in the rotated family must still work.
  const latest = await authService.refresh(forwarded.refreshToken);
  assert.ok(latest.accessToken.length > 0);

  // Age the original rotation past the grace window, then replay: theft path.
  const original = await refreshTokens.findByHash(
    tokenService.hashToken(firstSession.refreshToken),
  );
  assert.ok(original?.revokedAt);
  original.revokedAt = new Date(Date.now() - 61_000);

  const err = await captureError(() =>
    authService.refresh(firstSession.refreshToken),
  );
  assert.ok(err instanceof AuthenticationError);
  assert.equal(err.statusCode, 401);

  for (const row of await refreshTokens.allRows()) {
    assert.ok(row.revokedAt, `All rows must be revoked, found ${row.id} still active`);
  }

  // Sanity: the pre-rotation pair from the legitimate refresh is unaffected by
  // the test above only in that it was valid — replaced rows stay chained.
  assert.ok(rotated.refreshToken.length > 0);
});

// Test 6: logout() revokes the refresh token server-side so refresh() later fails.
test("6. logout() revokes the refresh token so a later refresh() with it fails", async () => {
  const { authService, tokenService, refreshTokens } = buildHarness();
  const session = await authService.register("alice@example.com", "password123");

  await authService.logout(session.refreshToken);

  const row = await refreshTokens.findByHash(
    tokenService.hashToken(session.refreshToken),
  );
  assert.ok(row);
  assert.ok(row.revokedAt, "Logout must revoke the row server-side");
  assert.equal(row.replacedBy, null, "Logout must not chain a replacement");

  const err = await captureError(() => authService.refresh(session.refreshToken));
  assert.ok(err instanceof AuthenticationError);
  assert.equal(err.statusCode, 401);
});

test("7c. cookie names match the documented auth contract", () => {
  assert.equal(ACCESS_TOKEN_COOKIE, "access_token");
  assert.equal(REFRESH_TOKEN_COOKIE, "refresh_token");
});

test("8c. register/login expose only id, email, role (tokens stay in cookies)", async () => {
  const { authService } = buildHarness();
  const session = await authService.register("alice@example.com", "password123");
  assert.deepEqual(Object.keys(session.user).sort(), ["email", "id", "role"]);
  const user = session.user as PublicUser;
  assert.equal(user.email, "alice@example.com");
  assert.equal(user.role, "user");
});

// Test 9: AuthController.me returns req.user when authenticated and 401 otherwise.
test("9. AuthController.me returns the session user or 401 without one", async () => {
  const { AuthController } = await import("../src/controllers/authController.js");
  const { AuthCookieConfig } = await import("../src/config/cookieConfig.js");
  const { authService } = buildHarness();
  const controller = new AuthController(authService, new AuthCookieConfig());

  let status = 0;
  let body: unknown = null;
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  };
  let nextErr: unknown = "not-called";
  const next = (err?: unknown): void => {
    nextErr = err ?? null;
  };

  await controller.me(
    { user: { id: "user-1", role: "user" } } as Request,
    res as unknown as Response,
    next,
  );
  assert.equal(status, 200);
  assert.deepEqual(body, {
    success: true,
    statusCode: 200,
    message: "Session retrieved successfully",
    data: { user: { id: "user-1", role: "user" } },
  });
  assert.equal(nextErr, "not-called");

  await controller.me({} as Request, res as unknown as Response, next);
  assert.ok((nextErr as unknown) instanceof AuthenticationError);
  assert.equal((nextErr as unknown as AuthenticationError).statusCode, 401);
});