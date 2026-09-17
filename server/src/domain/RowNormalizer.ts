import { CanonicalStatus, StatusClassifier } from "./StatusClassifier.js";
import { FieldAliasResolver, HeaderMapping } from "./FieldAliasResolver.js";
import type { RawRow } from "./StrictCsvParser.js";

export interface NormalizedRow {
  line: number;
  service: string;
  agentId: string;
  timestamp: Date;
  latencyMs: number | null;
  status: CanonicalStatus;
}

export interface RowIssue {
  row: number;
  field: string;
  code: string;
  message: string;
}

export interface NormalizationResult {
  row?: NormalizedRow;
  issues: RowIssue[];
}

const LATENCY_REGEX = /^\s*([+-]?[0-9]*\.?[0-9]+)\s*(ms|milliseconds?|s|secs?|seconds?|m|mins?|minutes?)?\s*$/i;

export class RowNormalizer {
  constructor(
    private readonly statusClassifier: StatusClassifier,
    private readonly fieldAliasResolver: FieldAliasResolver,
  ) {}

  normalize(raw: RawRow, headerMap?: HeaderMapping): NormalizationResult {
    const issues: RowIssue[] = [];
    const map = headerMap ?? this.fieldAliasResolver.resolveHeaderMap(raw.headers);

    const getCell = (idx: number): string => {
      if (idx < 0 || idx >= raw.cells.length) return "";
      return raw.cells[idx]?.trim() ?? "";
    };

    const rawAgent = getCell(map.agentIdx);
    const rawTimestamp = getCell(map.timestampIdx);
    const rawLatency = getCell(map.latencyIdx);
    const rawStatus = getCell(map.statusIdx);
    const rawService = getCell(map.serviceIdx);

    // Check required fields
    if (!rawAgent) {
      issues.push({
        row: raw.line,
        field: "agent",
        code: "MISSING_AGENT",
        message: "Missing required field: agent",
      });
    }

    if (!rawTimestamp) {
      issues.push({
        row: raw.line,
        field: "timestamp",
        code: "MISSING_TIMESTAMP",
        message: "Missing required field: timestamp",
      });
    }

    if (!rawStatus && rawStatus !== "0") {
      issues.push({
        row: raw.line,
        field: "status",
        code: "MISSING_STATUS",
        message: "Missing required field: status",
      });
    }

    // If critical fields missing, cannot form a row
    if (!rawAgent || !rawTimestamp || (!rawStatus && rawStatus !== "0")) {
      return { issues };
    }

    // Normalize Timestamp
    const timestampResult = this.parseTimestamp(rawTimestamp);
    if (!timestampResult.date) {
      issues.push({
        row: raw.line,
        field: "timestamp",
        code: "INVALID_TIMESTAMP",
        message: `Invalid timestamp format: "${rawTimestamp}"`,
      });
      return { issues };
    }

    // Normalize Agent ID
    const agentId = this.normalizeAgent(rawAgent);

    // Normalize Service (default to "default" if missing)
    const service = rawService || "default";

    // Normalize Status
    const statusEvidence = this.statusClassifier.classify(rawStatus);
    if (statusEvidence.issueCode) {
      issues.push({
        row: raw.line,
        field: "status",
        code: statusEvidence.issueCode,
        message: statusEvidence.message ?? `Invalid status: "${rawStatus}"`,
      });
    }

    // Normalize Latency
    const latencyResult = this.parseLatency(rawLatency);
    if (latencyResult.issue) {
      issues.push({
        row: raw.line,
        field: "latency",
        code: latencyResult.issue.code,
        message: latencyResult.issue.message,
      });
    }

    const row: NormalizedRow = {
      line: raw.line,
      service,
      agentId,
      timestamp: timestampResult.date,
      latencyMs: latencyResult.latencyMs,
      status: statusEvidence.status,
    };

    return { row, issues };
  }

  private parseTimestamp(raw: string): { date: Date | null } {
    const trimmed = raw.trim();
    if (/^\d{10}$/.test(trimmed)) {
      // 10 digits -> epoch seconds
      const seconds = Number.parseInt(trimmed, 10);
      const date = new Date(seconds * 1000);
      return { date: Number.isNaN(date.getTime()) ? null : date };
    }
    if (/^\d{13}$/.test(trimmed)) {
      // 13 digits -> epoch milliseconds
      const millis = Number.parseInt(trimmed, 10);
      const date = new Date(millis);
      return { date: Number.isNaN(date.getTime()) ? null : date };
    }
    // Try standard ISO-8601 / Date parse
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return { date: null };
    }
    return { date };
  }

  private parseLatency(raw: string): {
    latencyMs: number | null;
    issue?: { code: string; message: string };
  } {
    const trimmed = raw.trim();
    if (trimmed === "") {
      return { latencyMs: null };
    }

    const match = trimmed.match(LATENCY_REGEX);
    if (!match) {
      return {
        latencyMs: null,
        issue: {
          code: "INVALID_LATENCY",
          message: `Cannot parse latency string: "${raw}"`,
        },
      };
    }

    const num = Number.parseFloat(match[1]);
    const unit = (match[2] ?? "ms").toLowerCase();

    if (num < 0) {
      return {
        latencyMs: null,
        issue: {
          code: "NEGATIVE_LATENCY",
          message: `Negative latency "${raw}" normalized to null`,
        },
      };
    }

    if (unit.startsWith("m") && unit.includes("in")) {
      return { latencyMs: Math.round(num * 60_000) };
    }
    if (unit.startsWith("s")) {
      return { latencyMs: Math.round(num * 1_000) };
    }
    return { latencyMs: Math.round(num) };
  }

  private normalizeAgent(raw: string): string {
    const trimmed = raw.trim().toLowerCase();
    const match = trimmed.match(/^(?:server|host|node|agent)[ _-]*(\d+)$/i);
    if (match) {
      return `agent${match[1]}`;
    }
    return trimmed;
  }
}
