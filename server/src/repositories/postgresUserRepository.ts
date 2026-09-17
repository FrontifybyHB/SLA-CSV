import type { Pool } from "pg";

import type { UserRecord } from "../contracts/auth.js";
import type { IUserRepository } from "../contracts/auth.repository.interface.js";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
}

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, email, password_hash, role, created_at
       FROM users
       WHERE email = $1`,
      [email],
    );
    const row = result.rows[0];
    return row ? rowToRecord(row) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await this.pool.query<UserRow>(
      `SELECT id, email, password_hash, role, created_at
       FROM users
       WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? rowToRecord(row) : null;
  }

  async create(input: { email: string; passwordHash: string }): Promise<UserRecord> {
    const result = await this.pool.query<UserRow>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash, role, created_at`,
      [input.email, input.passwordHash],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("Failed to insert user");
    }
    return rowToRecord(row);
  }
}

function rowToRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}