export interface UserRecord {
  id: string;
  email: string;
  role: string;
  passwordHash: string;
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  role: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  createdAt: Date;
}

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export interface RefreshTokenSignResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSessionResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export const MIN_PASSWORD_LENGTH = 8;