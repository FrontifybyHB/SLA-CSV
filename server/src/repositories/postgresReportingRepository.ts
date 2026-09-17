import type { Pool } from "pg";

import type { DateRange, LogsResult, ObservationLog, SlotsResult, SlotRecordRow, StatsSummary } from "../contracts/reporting.js";
import type { IReportingRepository } from "../contracts/reporting.interface.js";

interface StatsRow {
  totalSlots: number;
  uptimeSeconds: number;
  downtimeSeconds: number;
  unknownSeconds: number;
  averageLatencyMs: number | null;
  up: number;
  down: number;
  unknown: number;
  mixed: number;
}

interface LogRow {
  _row_number: number;
  dataset_id: string;
  agent_id: string;
  timestamp: Date;
  latency_ms: number | null;
  status: string;
}

interface SlotRow {
  dataset_id: string;
  slot_key: string;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
  uptime_seconds: number;
  downtime_seconds: number;
  unknown_seconds: number;
  average_latency_ms: number | null;
  status: string;
}

interface CountRow {
  count: number;
}

interface Filter {
  where: string;
  params: unknown[];
}

export class PostgresReportingRepository implements IReportingRepository {
  constructor(private readonly pool: Pool) {}

  async getStats(
    userId: string,
    datasetIds: string[],
    range: DateRange,
  ): Promise<StatsSummary> {
    const { where, params } = this.buildFilter(userId, datasetIds, range, "start_time", "end_time");

    const result = await this.pool.query<StatsRow>(
      `SELECT
         count(*)::int AS "totalSlots",
         coalesce(sum(uptime_seconds), 0) AS "uptimeSeconds",
         coalesce(sum(downtime_seconds), 0) AS "downtimeSeconds",
         coalesce(sum(unknown_seconds), 0) AS "unknownSeconds",
         avg(average_latency_ms)::int AS "averageLatencyMs",
         count(*) FILTER (
           WHERE downtime_seconds > 0 AND uptime_seconds > 0
         )::int AS mixed,
         count(*) FILTER (
           WHERE unknown_seconds = duration_seconds
         )::int AS unknown,
         count(*) FILTER (
           WHERE downtime_seconds > 0 AND uptime_seconds = 0
         )::int AS down,
         count(*) FILTER (
           WHERE uptime_seconds > 0 AND downtime_seconds = 0
           AND NOT (unknown_seconds = duration_seconds)
         )::int AS up
       FROM slots
       WHERE ${where}`,
      params,
    );

    const row = result.rows[0] ?? emptyStatsRow();
    const uptime = Number(row.uptimeSeconds) || 0;
    const downtime = Number(row.downtimeSeconds) || 0;
    const availabilityPct = uptime + downtime > 0
      ? Math.round((uptime / (uptime + downtime)) * 10000) / 100
      : 0;

    return {
      datasetIds,
      totalSlots: row.totalSlots ?? 0,
      uptimeSeconds: uptime,
      downtimeSeconds: downtime,
      unknownSeconds: Number(row.unknownSeconds) || 0,
      availabilityPct,
      averageLatencyMs: row.averageLatencyMs ?? null,
      counts: {
        up: row.up ?? 0,
        down: row.down ?? 0,
        unknown: row.unknown ?? 0,
        mixed: row.mixed ?? 0,
      },
    };
  }

  async getLogs(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    page: number,
    pageSize: number,
  ): Promise<LogsResult> {
    const offset = (page - 1) * pageSize;
    const { where, params } = this.buildFilter(userId, datasetIds, range, "timestamp", "timestamp");
    const limitPlaceholder = params.length + 1;
    const offsetPlaceholder = params.length + 2;

    const [rows, countResult] = await Promise.all([
      this.pool.query<LogRow>(
        `SELECT row_number() OVER (ORDER BY timestamp DESC, agent_id ASC)::int AS _row_number,
                dataset_id, agent_id, timestamp, latency_ms, status
         FROM observations
         WHERE ${where}
         ORDER BY timestamp DESC, agent_id ASC
         LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
        [...params, pageSize, offset],
      ),
      this.pool.query<CountRow>(
        `SELECT count(*)::int AS count
         FROM observations
         WHERE ${where}`,
        params,
      ),
    ]);

    return {
      observations: rows.rows.map((r): ObservationLog => ({
        row: r._row_number,
        datasetId: r.dataset_id,
        agentId: r.agent_id,
        timestamp: r.timestamp,
        latencyMs: r.latency_ms,
        status: r.status,
      })),
      total: countResult.rows[0]?.count ?? 0,
      page,
      pageSize,
    };
  }

  async getSlots(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    page: number,
    pageSize: number,
  ): Promise<SlotsResult> {
    const offset = (page - 1) * pageSize;
    const { where, params } = this.buildFilter(userId, datasetIds, range, "start_time", "end_time");
    const limitPlaceholder = params.length + 1;
    const offsetPlaceholder = params.length + 2;

    const [rows, countResult] = await Promise.all([
      this.pool.query<SlotRow>(
        `SELECT dataset_id, slot_key, start_time, end_time, duration_seconds,
                uptime_seconds, downtime_seconds, unknown_seconds,
                average_latency_ms,
                CASE
                  WHEN unknown_seconds = duration_seconds THEN 'unknown'
                  WHEN downtime_seconds > 0 AND uptime_seconds > 0 THEN 'mixed'
                  WHEN downtime_seconds > 0 THEN 'down'
                  WHEN uptime_seconds > 0 THEN 'up'
                  ELSE 'unknown'
                END AS status
         FROM slots
         WHERE ${where}
         ORDER BY start_time DESC
         LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}`,
        [...params, pageSize, offset],
      ),
      this.pool.query<CountRow>(
        `SELECT count(*)::int AS count
         FROM slots
         WHERE ${where}`,
        params,
      ),
    ]);

    return {
      slots: rows.rows.map((r): SlotRecordRow => ({
        datasetId: r.dataset_id,
        slotKey: r.slot_key,
        startTime: r.start_time,
        endTime: r.end_time,
        durationSeconds: r.duration_seconds,
        uptimeSeconds: Number(r.uptime_seconds),
        downtimeSeconds: Number(r.downtime_seconds),
        unknownSeconds: Number(r.unknown_seconds),
        averageLatencyMs: r.average_latency_ms,
        status: r.status,
      })),
      total: countResult.rows[0]?.count ?? 0,
      page,
      pageSize,
      from: range.startDate,
      to: range.endDate,
    };
  }

  private buildFilter(
    userId: string,
    datasetIds: string[],
    range: DateRange,
    fromColumn: string,
    toColumn: string,
  ): Filter {
    // Always scoped to the requesting user at the query level; a dataset owned by
    // someone else is invisible even if its id is supplied.
    const parts = [
      `dataset_id IN (SELECT dataset_id FROM datasets WHERE user_id = $1)`,
    ];
    const params: unknown[] = [userId];

    if (datasetIds.length > 0) {
      params.push(datasetIds);
      parts.push(`dataset_id = ANY($${params.length}::uuid[])`);
    }

    params.push(range.startDate, range.endDate);
    const fromIndex = params.length - 1;
    parts.push(`${fromColumn} >= $${fromIndex} AND ${toColumn} <= $${fromIndex + 1}`);

    return {
      where: parts.join(" AND "),
      params,
    };
  }
}

function emptyStatsRow(): StatsRow {
  return {
    totalSlots: 0,
    uptimeSeconds: 0,
    downtimeSeconds: 0,
    unknownSeconds: 0,
    averageLatencyMs: null,
    up: 0,
    down: 0,
    unknown: 0,
    mixed: 0,
  };
}