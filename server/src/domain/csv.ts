import { StrictCsvParser } from "./StrictCsvParser.js";
import { FieldAliasResolver } from "./FieldAliasResolver.js";
import type { CsvParseResult, RawObservation } from "../contracts/import.js";
import { CsvFormatError } from "./normalize.js";
import { ImportError } from "../errors/ImportError.js";

const fieldAliasResolver = new FieldAliasResolver();
const strictParser = new StrictCsvParser();

export async function parseCsv(bytes: Buffer): Promise<CsvParseResult> {
  let rows;
  try {
    rows = strictParser.parseRows(bytes);
  } catch (err) {
    if (err instanceof ImportError) {
      throw new CsvFormatError(err.message);
    }
    throw err;
  }

  const headerRow = strictParser.lastHeaders;
  const headerMap = fieldAliasResolver.resolveHeaderMap(headerRow);

  // Check required columns: agent, timestamp (phase), status
  const missingCols: string[] = [];
  if (headerMap.agentIdx === -1) missingCols.push("agent");
  if (headerMap.timestampIdx === -1) missingCols.push("phase");
  if (headerMap.statusIdx === -1) missingCols.push("status");

  if (missingCols.length > 0) {
    throw new CsvFormatError(`CSV is missing required columns: ${missingCols.join(", ")}`);
  }

  const observations: RawObservation[] = [];
  const issues: CsvParseResult["issues"] = [];

  for (const row of rows) {
    const agentId = headerMap.agentIdx >= 0 ? row.cells[headerMap.agentIdx] ?? "" : "";
    const timestamp = headerMap.timestampIdx >= 0 ? row.cells[headerMap.timestampIdx] ?? "" : "";
    const latency = headerMap.latencyIdx >= 0 ? row.cells[headerMap.latencyIdx] ?? "" : "";
    const status = headerMap.statusIdx >= 0 ? row.cells[headerMap.statusIdx] ?? "" : "";

    if (!agentId && !timestamp && !latency && !status) {
      continue;
    }

    if (!agentId || !timestamp || !status) {
      const missingFields: string[] = [];
      if (!agentId) missingFields.push("agent");
      if (!timestamp) missingFields.push("phase");
      if (!status) missingFields.push("status");
      issues.push({
        row: row.line,
        field: missingFields.join(","),
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
      continue;
    }

    observations.push({
      agentId: agentId as RawObservation["agentId"],
      timestamp,
      latency,
      status,
    });
  }

  if (observations.length === 0) {
    throw new CsvFormatError("CSV does not contain any usable data rows");
  }

  return { observations, issues };
}