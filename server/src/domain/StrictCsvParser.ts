import { parse } from "csv-parse/sync";
import { ImportError } from "../errors/ImportError.js";

export interface RawRow {
  line: number;
  headers: string[];
  cells: string[];
}

export interface CsvParseOptions {
  trim?: boolean;
}

export class StrictCsvParser {
  private _lastHeaders: string[] = [];

  constructor() {}

  get lastHeaders(): string[] {
    return [...this._lastHeaders];
  }

  parseRows(bytes: Buffer, _options?: CsvParseOptions): RawRow[] {
    if (!bytes || bytes.length === 0) {
      throw new ImportError("EMPTY_FILE", "CSV file is empty");
    }

    let records: string[][];
    try {
      records = parse(bytes, {
        bom: true,
        relax_column_count: false,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err: unknown) {
      throw new ImportError(
        "MALFORMED_CSV_ROW",
        `Malformed or ragged CSV row encountered: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (records.length === 0) {
      throw new ImportError("EMPTY_FILE", "CSV file is empty");
    }

    const headerCells = records[0].map((c) => c.trim());
    if (headerCells.length === 0 || headerCells.every((c) => c === "")) {
      throw new ImportError("EMPTY_HEADERS", "CSV headers are missing or empty");
    }

    const expectedColCount = headerCells.length;
    this._lastHeaders = headerCells;

    const rows: RawRow[] = [];
    for (let i = 1; i < records.length; i++) {
      const record = records[i];
      // If skip_empty_lines did not catch an empty line
      if (record.length === 1 && record[0].trim() === "") {
        continue;
      }
      if (record.length !== expectedColCount) {
        throw new ImportError(
          "MALFORMED_CSV_ROW",
          `Ragged CSV row at line ${i + 1}: expected ${expectedColCount} columns, found ${record.length}`,
        );
      }
      rows.push({
        line: i + 1,
        headers: headerCells,
        cells: record.map((c) => c.trim()),
      });
    }

    if (rows.length === 0) {
      throw new ImportError("NO_DATA_ROWS", "CSV contains no data rows");
    }

    return rows;
  }
}
