-- 001: auth tables + per-user dataset isolation
-- Assumes no pre-existing rows in datasets when the NOT NULL user_id is added;
-- if the table has rows, backfill user_id first, then set NOT NULL.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  replaced_by UUID REFERENCES refresh_tokens(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- Scope every dataset row to its owner.
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Backfill any pre-existing datasets (pre-auth data) to a dedicated legacy owner so
-- the NOT NULL column can be applied below.
INSERT INTO users (email, password_hash, role)
SELECT '__legacy__.invalid', '!', 'user'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '__legacy__.invalid');

UPDATE datasets
SET user_id = (SELECT id FROM users WHERE email = '__legacy__.invalid')
WHERE user_id IS NULL;

-- Fix the idempotency key: (file_hash, policy_version) -> (file_hash, policy_version, user_id)
ALTER TABLE datasets DROP CONSTRAINT IF EXISTS datasets_file_hash_policy_version_key;
ALTER TABLE datasets DROP CONSTRAINT IF EXISTS datasets_file_hash_policy_version_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS datasets_file_hash_policy_version_user_id_key
  ON datasets (file_hash, policy_version, user_id);

ALTER TABLE datasets ALTER COLUMN user_id SET NOT NULL;