CREATE TABLE IF NOT EXISTS datasets (
  dataset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  checklist_format TEXT NOT NULL,
  checklist_version TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  agent_count INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (file_hash, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_datasets_uploaded_at ON datasets (uploaded_at DESC);

CREATE TABLE IF NOT EXISTS observations (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets (dataset_id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  latency_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('up', 'down', 'unknown')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_observations_dataset_time
  ON observations (dataset_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_observations_dataset_agent_time
  ON observations (dataset_id, agent_id, timestamp);

CREATE TABLE IF NOT EXISTS slots (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets (dataset_id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  uptime_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
  downtime_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
  unknown_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
  average_latency_ms INTEGER,
  UNIQUE (dataset_id, slot_key)
);

CREATE INDEX IF NOT EXISTS idx_slots_dataset_time
  ON slots (dataset_id, start_time);

CREATE TABLE IF NOT EXISTS data_quality_issues (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets (dataset_id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  field TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issues_dataset
  ON data_quality_issues (dataset_id);