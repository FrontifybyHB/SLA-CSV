import { parse } from "csv-parse/sync";
import { ImportError } from "../errors/ImportError.js";

export interface RawRow {
  line: number;
  headers: string[];
  cells: string[];
}

export interface RaggedRowIssue {
  row: number;
  field: string;
  code: string;
  message: string;
}

export interface CsvParseOptions {
  trim?: boolean;
  maxRows?: number;
  maxColumns?: number;
}

export class StrictCsvParser {
  private _lastHeaders: string[] = [];
  private _raggedIssues: RaggedRowIssue[] = [];

  constructor(
    private readonly defaultMaxRows = 100_000,
    private readonly defaultMaxColumns = 100,
  ) {}

  get lastHeaders(): string[] {
    return [...this._lastHeaders];
  }

  /** Issues for rows skipped due to column-count mismatch in the last parse. */
  get raggedIssues(): RaggedRowIssue[] {
    return [...this._raggedIssues];
  }

  parseRows(bytes: Buffer, options?: CsvParseOptions): RawRow[] {
    if (!bytes || bytes.length === 0) {
      throw new ImportError("EMPTY_FILE", "CSV file is empty");
    }

    this._raggedIssues = [];

    const maxRows = options?.maxRows ?? this.defaultMaxRows;
    const maxColumns = options?.maxColumns ?? this.defaultMaxColumns;

    let records: string[][];
    try {
      records = parse(bytes, {
        bom: true,
        // Tolerate ragged rows: instead of failing the whole file, quarantine
        // the bad row as an issue and keep processing valid rows.
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err: unknown) {
      throw new ImportError(
        "MALFORMED_CSV_ROW",
        `Malformed CSV encountered: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (records.length === 0) {
      throw new ImportError("EMPTY_FILE", "CSV file is empty");
    }

    // Enforce column limit on headers
    if (records[0].length > maxColumns) {
      throw new ImportError(
        "TOO_MANY_COLUMNS",
        `CSV header has ${records[0].length} columns, maximum allowed is ${maxColumns}`,
      );
    }

    const headerCells = records[0].map((c) => c.trim());
    if (headerCells.length === 0 || headerCells.every((c) => c === "")) {
      throw new ImportError("EMPTY_HEADERS", "CSV headers are missing or empty");
    }

    const expectedColCount = headerCells.length;
    this._lastHeaders = headerCells;

    // Enforce row limit (data rows only, excluding header)
    const dataRowCount = records.length - 1;
    if (dataRowCount > maxRows) {
      throw new ImportError(
        "TOO_MANY_ROWS",
        `CSV has ${dataRowCount} data rows, maximum allowed is ${maxRows}`,
      );
    }

    const rows: RawRow[] = [];
    for (let i = 1; i < records.length; i++) {
      const record = records[i];
      // If skip_empty_lines did not catch an empty line
      if (record.length === 1 && record[0].trim() === "") {
        continue;
      }
      if (record.length !== expectedColCount) {
        // Quarantine the ragged row instead of rejecting the whole file.
        this._raggedIssues.push({
          row: i + 1,
          field: "row",
          code: "RAGGED_ROW",
          message: `Ragged CSV row at line ${i + 1}: expected ${expectedColCount} columns, found ${record.length}. Row skipped.`,
        });
        continue;
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
