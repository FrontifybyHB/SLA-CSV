import type { Pool, PoolClient } from "pg";

import type { PreparedImport } from "../contracts/import.js";
import type { DatasetSummary, SaveImportResult } from "../contracts/repository.js";
import type { IDatasetRepository } from "../contracts/repository.interface.js";
import { AppError } from "../middlewares/appError.js";

const BATCH_SIZE = 500;

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
         (SELECT count(*)::int FROM observations o WHERE o.dataset_id = d.dataset_id) AS observation_count,
         (SELECT count(*)::int FROM slots s WHERE s.dataset_id = d.dataset_id) AS slot_count,
         (SELECT count(*)::int FROM data_quality_issues i WHERE i.dataset_id = d.dataset_id) AS issue_count
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

  async listDatasets(userId: string): Promise<DatasetSummary[]> {
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
         (SELECT count(*)::int FROM observations o WHERE o.dataset_id = d.dataset_id) AS observation_count,
         (SELECT count(*)::int FROM slots s WHERE s.dataset_id = d.dataset_id) AS slot_count,
         (SELECT count(*)::int FROM data_quality_issues i WHERE i.dataset_id = d.dataset_id) AS issue_count
       FROM datasets d
       WHERE d.user_id = $1
       ORDER BY d.uploaded_at DESC`,
      [userId],
    );
    return result.rows.map(rowToSummary);
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
         (SELECT count(*)::int FROM observations o WHERE o.dataset_id = d.dataset_id) AS observation_count,
         (SELECT count(*)::int FROM slots s WHERE s.dataset_id = d.dataset_id) AS slot_count,
         (SELECT count(*)::int FROM data_quality_issues i WHERE i.dataset_id = d.dataset_id) AS issue_count
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
           start_date, end_date, agent_count, user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        ],
      );

      const datasetId = datasetResult.rows[0]?.dataset_id;
      if (!datasetId) {
        throw new AppError("Failed to insert dataset", 500);
      }

      // Batch 500 inserts for observations
      await this.insertObservationsInBatches(client, datasetId, input.observations);

      // Batch 500 inserts for slots (check_slots)
      await this.insertSlotsInBatches(client, datasetId, input.slots);

      // Batch 500 inserts for issues (import_issues)
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
      const timestamps = batch.map((o) => o.timestamp);
      const latencies = batch.map((o) => o.latencyMs);
      const statuses = batch.map((o) => o.status);

      await client.query(
        `INSERT INTO observations (dataset_id, agent_id, timestamp, latency_ms, status)
         SELECT $1, unnest($2::text[]), unnest($3::timestamptz[]), unnest($4::int[]), unnest($5::text[])`,
        [datasetId, agentIds, timestamps, latencies, statuses],
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
           dataset_id, slot_key, start_time, end_time, duration_seconds,
           uptime_seconds, downtime_seconds, unknown_seconds, average_latency_ms
         )
         SELECT $1, unnest($2::text[]), unnest($3::timestamptz[]), unnest($4::timestamptz[]),
                unnest($5::int[]), unnest($6::double precision[]), unnest($7::double precision[]),
                unnest($8::double precision[]), unnest($9::int[])
         ON CONFLICT (dataset_id, slot_key) DO NOTHING`,
        [datasetId, keys, startTimes, endTimes, durations, uptimes, downtimes, unknowns, latencies],
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