import type { AgentId } from "../contracts/import.js";
import { AppError } from "../middlewares/appError.js";
import { StatusClassifier } from "./StatusClassifier.js";

const statusClassifier = new StatusClassifier();

export class CsvFormatError extends AppError {
  constructor(message: string, statusCode = 422) {
    super(message, statusCode);
    this.name = "CsvFormatError";
  }
}

export function normalizeAgentId(raw: string): AgentId {
  const value = raw.trim().toLowerCase();
  if (/^agent[123]$/.test(value)) {
    return value as AgentId;
  }
  const match = value.match(/^(?:server|host|node|agent)[ _-]*(\d+)$/i);
  if (match && Number(match[1]) >= 1 && Number(match[1]) <= 3) {
    return `agent${match[1]}` as AgentId;
  }
  throw new CsvFormatError(`Unrecognized agent identifier: "${raw}"`);
}

export function normalizeTimestamp(raw: string): Date {
  const trimmed = raw.trim();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new CsvFormatError(`Invalid timestamp: "${raw}"`);
  }
  return parsed;
}

export function normalizeLatency(raw: string, unit = "ms"): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const value = Number(trimmed);
  if (Number.isNaN(value) || value < 0) {
    throw new CsvFormatError(`Invalid latency: "${raw}"`);
  }
  if (unit === "s") {
    return Math.round(value * 1000);
  }
  return Math.round(value);
}

const LATENCY_PATTERN = /^\s*([0-9]*\.?[0-9]+)\s*(ms|milliseconds?|s|secs?|seconds?|m|mins?|minutes?)?\s*$/i;

export function parseLatency(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const match = trimmed.match(LATENCY_PATTERN);
  if (!match) {
    throw new CsvFormatError(`Invalid latency: "${raw}"`);
  }
  const value = Number(match[1]);
  const unit = (match[2] ?? "ms").toLowerCase();
  if (value < 0) {
    throw new CsvFormatError(`Invalid latency: "${raw}"`);
  }
  if (unit.startsWith("m")) {
    return Math.round(value);
  }
  if (unit.startsWith("s")) {
    return Math.round(value * 1000);
  }
  throw new CsvFormatError(`Unsupported latency unit in "${raw}"`);
}

export function classifyStatus(raw: string): "up" | "down" | "unknown" {
  const res = statusClassifier.classify(raw);
  if (res.issueCode === "INVALID_HTTP_STATUS" || res.issueCode === "UNRECOGNIZED_STATUS") {
    throw new CsvFormatError(`Unrecognized status: "${raw}"`);
  }
  if (res.status === "UP") return "up";
  if (res.status === "DOWN") return "down";
  return "unknown";
}