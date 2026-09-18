import type { Pool, PoolClient } from "pg";

import type { PreparedImport } from "../contracts/import.js";
import type { DatasetSummary, SaveImportResult } from "../contracts/repository.js";
import type { IDatasetRepository } from "../contracts/repository.interface.js";
import { AppError } from "../middlewares/appError.js";

const BATCH_SIZE = 1000;

const MAX_LIST_PAGE_SIZE = 100;
const DEFAULT_LIST_PAGE_SIZE = 20;

interface DatasetRow {
  dataset_id: string;
  filename: string;
  file_hash: string;
  policy_version: string;
  start_date: Date;
  end_date: Date;
  agent_count: number;
  uploaded_at: Date;
  observation_count: number;
  slot_count: number;
  issue_count: number;
}

export class PostgresDatasetRepository implements IDatasetRepository {
  constructor(private readonly pool: Pool) {}

  async findByHash(
    fileHash: string,
    policyVersion: string,
    userId: string,
  ): Promise<DatasetSummary | null> {
    return this.findByFingerprint(fileHash, policyVersion, userId);
  }

  async findByFingerprint(
    hash: string,
    policyVersion: string,
    userId: string,
  ): Promise<DatasetSummary | null> {
    const result = await this.pool.query<DatasetRow>(
      `SELECT
         d.dataset_id,
         d.filename,
         d.file_hash,
         d.policy_version,
         d.start_date,
         d.end_date,
         d.agent_count,
         d.uploaded_at,
         d.observation_count,
         d.slot_count,
         d.issue_count
        FROM datasets d
        WHERE d.file_hash = $1 AND d.policy_version = $2 AND d.user_id = $3
        ORDER BY d.uploaded_at DESC
        LIMIT 1`,
      [hash, policyVersion, userId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return rowToSummary(row);
  }

  async listDatasets(userId: string, page = 1, pageSize = DEFAULT_LIST_PAGE_SIZE): Promise<DatasetSummary[]> {
    const { datasets } = await this.listDatasetsPaginated(userId, page, pageSize);
    return datasets;
  }

  async listDatasetsPaginated(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ datasets: DatasetSummary[]; total: number }> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safePageSize = Math.min(
      MAX_LIST_PAGE_SIZE,
      Math.max(1, Math.floor(pageSize) || DEFAULT_LIST_PAGE_SIZE),
    );
    const offset = (safePage - 1) * safePageSize;
    const [rows, countResult] = await Promise.all([
      this.pool.query<DatasetRow>(
        `SELECT
           d.dataset_id,
           d.filename,
           d.file_hash,
           d.policy_version,
           d.start_date,
           d.end_date,
           d.agent_count,
           d.uploaded_at,
           d.observation_count,
           d.slot_count,
           d.issue_count
         FROM datasets d
         WHERE d.user_id = $1
         ORDER BY d.uploaded_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, safePageSize, offset],
      ),
      this.pool.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM datasets WHERE user_id = $1`,
        [userId],
      ),
    ]);
    return {
      datasets: rows.rows.map(rowToSummary),
      total: countResult.rows[0]?.count ?? 0,
    };
  }

  async findById(datasetId: string, userId: string): Promise<DatasetSummary | null> {
    const result = await this.pool.query<DatasetRow>(
      `SELECT
         d.dataset_id,
         d.filename,
         d.file_hash,
         d.policy_version,
         d.start_date,
         d.end_date,
         d.agent_count,
         d.uploaded_at,
         d.observation_count,
         d.slot_count,
         d.issue_count
        FROM datasets d
        WHERE d.dataset_id = $1 AND d.user_id = $2
        LIMIT 1`,
      [datasetId, userId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return rowToSummary(row);
  }

  async saveImport(input: PreparedImport): Promise<SaveImportResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const datasetResult = await client.query<{ dataset_id: string }>(
        `INSERT INTO datasets (
           filename, file_hash, policy_version,
           checklist_format, checklist_version,
           start_date, end_date, agent_count, user_id,
           observation_count, slot_count, issue_count
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING dataset_id`,
        [
          input.filename,
          input.fileHash,
          input.policyVersion,
          input.checklist.format,
          input.checklist.version,
          input.checklist.startDate,
          input.checklist.endDate,
          input.checklist.agentCount,
          input.userId,
          input.observations.length,
          input.slots.length,
          input.issues.length,
        ],
      );

      const datasetId = datasetResult.rows[0]?.dataset_id;
      if (!datasetId) {
        throw new AppError("Failed to insert dataset", 500);
      }

      // Batch inserts (1000 rows per round-trip) for observations
      await this.insertObservationsInBatches(client, datasetId, input.observations);

      // Batch inserts for slots (check_slots)
      await this.insertSlotsInBatches(client, datasetId, input.slots);

      // Batch inserts for issues (import_issues)
      await this.insertIssuesInBatches(client, datasetId, input.issues);

      await client.query("COMMIT");

      return {
        datasetId,
        observationCount: input.observations.length,
        slotCount: input.slots.length,
        issueCount: input.issues.length,
      };
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore rollback errors if connection died
      }
      throw err;
    } finally {
      client.release();
    }
  }

  private async insertObservationsInBatches(
    client: PoolClient,
    datasetId: string,
    observations: PreparedImport["observations"],
  ): Promise<void> {
    for (let i = 0; i < observations.length; i += BATCH_SIZE) {
      const batch = observations.slice(i, i + BATCH_SIZE);
      const agentIds = batch.map((o) => o.agentId);
      const services = batch.map((o) => o.service);
      const timestamps = batch.map((o) => o.timestamp);
      const latencies = batch.map((o) => o.latencyMs);
      const statuses = batch.map((o) => o.status);
      const regions = batch.map((o) => (o as { region?: string | null }).region ?? null);

      await client.query(
        `INSERT INTO observations (dataset_id, service, agent_id, timestamp, latency_ms, status, region)
         SELECT $1, unnest($2::text[]), unnest($3::text[]), unnest($4::timestamptz[]), unnest($5::int[]), unnest($6::text[]), unnest($7::text[])`,
        [datasetId, services, agentIds, timestamps, latencies, statuses, regions],
      );
    }
  }

  private async insertSlotsInBatches(
    client: PoolClient,
    datasetId: string,
    slots: PreparedImport["slots"],
  ): Promise<void> {
    for (let i = 0; i < slots.length; i += BATCH_SIZE) {
      const batch = slots.slice(i, i + BATCH_SIZE);
      const services = batch.map((s) => s.service);
      const keys = batch.map((s) => s.slotKey);
      const startTimes = batch.map((s) => s.startTime);
      const endTimes = batch.map((s) => s.endTime);
      const durations = batch.map((s) => s.durationSeconds);
      const uptimes = batch.map((s) => s.uptimeSeconds);
      const downtimes = batch.map((s) => s.downtimeSeconds);
      const unknowns = batch.map((s) => s.unknownSeconds);
      const latencies = batch.map((s) => s.averageLatencyMs);

      await client.query(
        `INSERT INTO slots (
           dataset_id, service, slot_key, start_time, end_time, duration_seconds,
           uptime_seconds, downtime_seconds, unknown_seconds, average_latency_ms
         )
         SELECT $1, unnest($2::text[]), unnest($3::text[]), unnest($4::timestamptz[]), unnest($5::timestamptz[]),
                unnest($6::int[]), unnest($7::double precision[]), unnest($8::double precision[]),
                unnest($9::double precision[]), unnest($10::int[])
         ON CONFLICT (dataset_id, service, slot_key) DO NOTHING`,
        [datasetId, services, keys, startTimes, endTimes, durations, uptimes, downtimes, unknowns, latencies],
      );
    }
  }

  private async insertIssuesInBatches(
    client: PoolClient,
    datasetId: string,
    issues: PreparedImport["issues"],
  ): Promise<void> {
    for (let i = 0; i < issues.length; i += BATCH_SIZE) {
      const batch = issues.slice(i, i + BATCH_SIZE);
      const rows = batch.map((iss) => iss.row);
      const fields = batch.map((iss) => iss.field);
      const messages = batch.map((iss) => iss.message);

      await client.query(
        `INSERT INTO data_quality_issues (dataset_id, row_number, field, message)
         SELECT $1, unnest($2::int[]), unnest($3::text[]), unnest($4::text[])`,
        [datasetId, rows, fields, messages],
      );
    }
  }
}

function rowToSummary(row: DatasetRow): DatasetSummary {
  return {
    datasetId: row.dataset_id,
    filename: row.filename,
    fileHash: row.file_hash,
    policyVersion: row.policy_version,
    startDate: row.start_date,
    endDate: row.end_date,
    agentCount: row.agent_count,
    observationCount: row.observation_count,
    slotCount: row.slot_count,
    issueCount: row.issue_count,
    uploadedAt: row.uploaded_at,
  };
}