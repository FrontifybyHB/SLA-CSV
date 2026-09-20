import type { Pool } from "pg";

import type { RefreshTokenRecord } from "../contracts/auth.js";
import type {
  IRefreshTokenRepository,
  StoreRefreshTokenInput,
} from "../contracts/auth.repository.interface.js";

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by: string | null;
  created_at: Date;
}

const SELECT_COLUMNS = `
  id,
  user_id,
  token_hash,
  expires_at,
  revoked_at,
  replaced_by,
  created_at`;

export class PostgresRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly pool: Pool) {}

  async store(input: StoreRefreshTokenInput): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [input.userId, input.tokenHash, input.expiresAt],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Failed to store refresh token");
    }
    return row.id;
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const result = await this.pool.query<RefreshTokenRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM refresh_tokens
       WHERE token_hash = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? rowToRecord(row) : null;
  }

  async findValidByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const result = await this.pool.query<RefreshTokenRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM refresh_tokens
       WHERE token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > now()
       ORDER BY created_at DESC
       LIMIT 1`,
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? rowToRecord(row) : null;
  }

  async findById(id: string): Promise<RefreshTokenRecord | null> {
    const result = await this.pool.query<RefreshTokenRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM refresh_tokens
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    const row = result.rows[0];
    return row ? rowToRecord(row) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens
       SET revoked_at = now()
       WHERE id = $1`,
      [id],
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens
       SET revoked_at = now()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  }

  async markReplaced(oldId: string, newId: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens
       SET revoked_at = now(), replaced_by = $2
       WHERE id = $1`,
      [oldId, newId],
    );
  }

  async rotate(oldId: string, input: StoreRefreshTokenInput): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query<RefreshTokenRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM refresh_tokens
         WHERE id = $1
         FOR UPDATE`,
        [oldId],
      );
      const row = current.rows[0];
      if (!row || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) {
        await client.query("ROLLBACK");
        return null;
      }
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [input.userId, input.tokenHash, input.expiresAt],
      );
      const newRow = inserted.rows[0];
      if (!newRow) {
        await client.query("ROLLBACK");
        throw new Error("Failed to store refresh token");
      }
      await client.query(
        `UPDATE refresh_tokens
         SET revoked_at = now(), replaced_by = $2
         WHERE id = $1`,
        [oldId, newRow.id],
      );
      await client.query("COMMIT");
      return newRow.id;
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Rollback of a failed transaction best-effort only.
      }
      throw err;
    } finally {
      client.release();
    }
  }
}

function rowToRecord(row: RefreshTokenRow): RefreshTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    replacedBy: row.replaced_by,
    createdAt: row.created_at,
  };
}