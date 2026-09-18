-- 003: add region column to observations (optional location of the check)
-- Idempotent: uses ADD COLUMN IF NOT EXISTS

ALTER TABLE observations ADD COLUMN IF NOT EXISTS region TEXT;

CREATE INDEX IF NOT EXISTS idx_observations_dataset_region
  ON observations (dataset_id, region);
