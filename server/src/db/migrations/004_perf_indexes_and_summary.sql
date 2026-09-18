-- 004: performance — precomputed dataset counts + covering indexes
-- Implements: batch-friendly reads, small payloads, paginated lists, cache-stable summaries.

-- Precomputed summary counts on datasets (populated at import time).
-- Eliminates 3x correlated COUNT(*) subselects per dataset row in list/detail.
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS observation_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS slot_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS issue_count INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing rows (one-time; cheap relative to per-request counts).
UPDATE datasets d
SET observation_count = COALESCE((SELECT count(*) FROM observations o WHERE o.dataset_id = d.dataset_id), 0),
    slot_count = COALESCE((SELECT count(*) FROM slots s WHERE s.dataset_id = d.dataset_id), 0),
    issue_count = COALESCE((SELECT count(*) FROM data_quality_issues i WHERE i.dataset_id = d.dataset_id), 0)
WHERE d.observation_count = 0 AND d.slot_count = 0 AND d.issue_count = 0;

-- Owner-scoped listing (dashboard inventory, idempotency check).
CREATE INDEX IF NOT EXISTS idx_datasets_user_uploaded ON datasets (user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_datasets_file_hash ON datasets (file_hash);

-- Observation filters: service / region / status + time range per dataset.
CREATE INDEX IF NOT EXISTS idx_observations_dataset_service_time
  ON observations (dataset_id, service, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_observations_dataset_region_time
  ON observations (dataset_id, region, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_observations_dataset_status_time
  ON observations (dataset_id, status, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_observations_dataset_time_desc
  ON observations (dataset_id, timestamp DESC);

-- Slot filters: service + time range per dataset.
CREATE INDEX IF NOT EXISTS idx_slots_dataset_service_time
  ON slots (dataset_id, service, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_slots_dataset_time_desc
  ON slots (dataset_id, start_time DESC);

-- Issue pagination ordering.
CREATE INDEX IF NOT EXISTS idx_issues_dataset_row
  ON data_quality_issues (dataset_id, row_number ASC);
