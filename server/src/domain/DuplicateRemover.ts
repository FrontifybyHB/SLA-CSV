import type { NormalizedRow } from "./RowNormalizer.js";

export interface DuplicateRemovalResult {
  uniqueRows: NormalizedRow[];
  duplicateCount: number;
}

export class DuplicateRemover {
  constructor() {}

  removeDuplicates(rows: NormalizedRow[]): DuplicateRemovalResult {
    const seen = new Set<string>();
    const uniqueRows: NormalizedRow[] = [];
    let duplicateCount = 0;

    for (const row of rows) {
      const key = `${row.service}|${row.agentId}|${row.timestamp.getTime()}|${row.latencyMs ?? "null"}|${row.status}`;
      if (seen.has(key)) {
        duplicateCount++;
      } else {
        seen.add(key);
        uniqueRows.push(row);
      }
    }

    return { uniqueRows, duplicateCount };
  }
}
