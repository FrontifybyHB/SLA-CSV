import type { PublicUser, RefreshTokenRecord, UserRecord } from "./auth.js";

export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: { email: string; passwordHash: string }): Promise<UserRecord>;
}

export interface StoreRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IRefreshTokenRepository {
  store(input: StoreRefreshTokenInput): Promise<string>;

  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;

  findValidByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;

  /** Fetch a row by id (used to follow the rotation chain on replay). */
  findById(id: string): Promise<RefreshTokenRecord | null>;

  revoke(id: string): Promise<void>;

  revokeAllForUser(userId: string): Promise<void>;

  markReplaced(oldId: string, newId: string): Promise<void>;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}