-- 002: add service column to observations and slots for per-service filtering
-- Idempotent: uses ADD COLUMN IF NOT EXISTS

ALTER TABLE observations ADD COLUMN IF NOT EXISTS service TEXT NOT NULL DEFAULT 'default';

ALTER TABLE slots ADD COLUMN IF NOT EXISTS service TEXT NOT NULL DEFAULT 'default';

-- Drop the old unique constraint (dataset_id, slot_key) and replace with (dataset_id, service, slot_key)
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_dataset_id_slot_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS slots_dataset_id_service_slot_key_key
  ON slots (dataset_id, service, slot_key);

-- Indexes for service-scoped queries
CREATE INDEX IF NOT EXISTS idx_observations_dataset_service
  ON observations (dataset_id, service);

CREATE INDEX IF NOT EXISTS idx_slots_dataset_service
  ON slots (dataset_id, service);
