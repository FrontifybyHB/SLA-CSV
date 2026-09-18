import { StrictCsvParser } from "./StrictCsvParser.js";
import { NormalizedRow, RowIssue, RowNormalizer } from "./RowNormalizer.js";
import { DuplicateRemover } from "./DuplicateRemover.js";
import { AgentEvidenceResolver, AgentSlotEvidence, SLOT_DURATION_MS } from "./AgentEvidenceResolver.js";
import { CanonicalSlot, SlotResolver } from "./SlotResolver.js";
import { MissingSlotGenerator } from "./MissingSlotGenerator.js";
import { QualityMetrics, QualityMetricsCalculator } from "./QualityMetricsCalculator.js";
import { ImportError } from "../errors/ImportError.js";

export interface SlaProcessingResult {
  observations: NormalizedRow[];
  slots: CanonicalSlot[];
  issues: RowIssue[];
  metrics: QualityMetrics;
}

function rowKey(r: NormalizedRow): string {
  return `${r.service}|${r.agentId}|${r.timestamp.getTime()}|${r.latencyMs ?? "null"}|${r.status}|${r.region ?? "null"}`;
}

export class SlaCsvProcessor {
  constructor(
    private readonly csvParser: StrictCsvParser,
    private readonly rowNormalizer: RowNormalizer,
    private readonly duplicateRemover: DuplicateRemover,
    private readonly agentEvidenceResolver: AgentEvidenceResolver,
    private readonly slotResolver: SlotResolver,
    private readonly missingSlotGenerator: MissingSlotGenerator,
    private readonly qualityMetricsCalculator: QualityMetricsCalculator,
  ) {}

  process(bytes: Buffer): SlaProcessingResult {
    const startTime = process.hrtime.bigint();

    // 1. Parse (ragged rows are quarantined, not fatal)
    const rawRows = this.csvParser.parseRows(bytes);
    const issues: RowIssue[] = [...this.csvParser.raggedIssues];

    // 1b. Header validation: fail fast with a useful message when required
    // columns are absent, instead of silently dropping every row.
    const headers = this.csvParser.lastHeaders;
    if (headers.length > 0) {
      const headerMap = this.rowNormalizer.resolveHeaderMap(headers);
      const missing: string[] = [];
      if (headerMap.agentIdx < 0) missing.push("agent (agent/agent_id/server/host)");
      if (headerMap.timestampIdx < 0) missing.push("timestamp (timestamp/time/ts/datetime)");
      if (headerMap.statusIdx < 0) missing.push("status (status/state/status_code/http_status)");
      if (missing.length > 0) {
        throw new ImportError(
          "MISSING_REQUIRED_HEADERS",
          `CSV is missing required column(s): ${missing.join(", ")}. Received headers: [${headers.join(", ")}]`,
        );
      }
    }

    // 2. Row Normalization
    const normalizedRows: NormalizedRow[] = [];

    // Resolve the header map once (headers are identical for every row).
    const sharedHeaderMap = rawRows.length > 0 ? this.rowNormalizer.resolveHeaderMap(rawRows[0].headers) : undefined;

    for (const raw of rawRows) {
      const res = this.rowNormalizer.normalize(raw, sharedHeaderMap);
      issues.push(...res.issues);
      if (res.row) {
        normalizedRows.push(res.row);
      }
    }

    if (normalizedRows.length === 0) {
      throw new ImportError(
        "NO_VALID_ROWS",
        `CSV contained ${rawRows.length} data row(s) but none could be normalized. ` +
          `${issues.length} issue(s) recorded (e.g. missing agent/timestamp/status, invalid timestamps). ` +
          `Fix the flagged rows and re-upload.`,
      );
    }

    // 3. Single-pass Duplicate Removal with issue recording (eliminates double dedupe)
    const seen = new Map<string, NormalizedRow>();
    const uniqueRows: NormalizedRow[] = [];
    let duplicateCount = 0;

    for (const r of normalizedRows) {
      const key = rowKey(r);
      if (seen.has(key)) {
        duplicateCount++;
        issues.push({
          row: r.line,
          field: "row",
          code: "DUPLICATE_ROW",
          message: `Duplicate of an earlier row (service=${r.service}, agent=${r.agentId}); collapsed.`,
        });
      } else {
        seen.set(key, r);
        uniqueRows.push(r);
      }
    }

    // 4. Same-Agent 15-Minute Slot Evidence Resolution
    const { evidences, issues: agentIssues } = this.agentEvidenceResolver.resolve(uniqueRows);
    issues.push(...agentIssues);

    // 5. Multi-Agent Slot Resolution & Missing Slot Generation per Service
    const evidencesByServiceAndSlot = new Map<string, Map<string, AgentSlotEvidence[]>>();
    const serviceMinMax = new Map<string, { minTime: Date; maxTime: Date }>();

    for (const ev of evidences) {
      let slotsForService = evidencesByServiceAndSlot.get(ev.service);
      if (!slotsForService) {
        slotsForService = new Map<string, AgentSlotEvidence[]>();
        evidencesByServiceAndSlot.set(ev.service, slotsForService);
      }

      let evList = slotsForService.get(ev.slotKey);
      if (!evList) {
        evList = [];
        slotsForService.set(ev.slotKey, evList);
      }
      evList.push(ev);

      // Track min/max time per service
      const minMax = serviceMinMax.get(ev.service);
      if (!minMax) {
        serviceMinMax.set(ev.service, { minTime: ev.slotStart, maxTime: ev.slotStart });
      } else {
        if (ev.slotStart < minMax.minTime) minMax.minTime = ev.slotStart;
        if (ev.slotStart > minMax.maxTime) minMax.maxTime = ev.slotStart;
      }
    }

    const allResolvedSlots: CanonicalSlot[] = [];

    for (const [service, slotsForService] of evidencesByServiceAndSlot.entries()) {
      const observedSlots = new Map<string, CanonicalSlot>();

      for (const [slotKey, evList] of slotsForService.entries()) {
        const slotStart = new Date(slotKey);
        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MS);
        const resolved = this.slotResolver.resolveSlot(service, slotStart, slotEnd, evList);
        observedSlots.set(slotKey, resolved);
      }

      const { minTime, maxTime } = serviceMinMax.get(service)!;
      const fullServiceSlots = this.missingSlotGenerator.generate(
        service,
        observedSlots,
        minTime,
        maxTime,
      );

      allResolvedSlots.push(...fullServiceSlots);
    }

    // Sort slots deterministically by service, then startTime
    allResolvedSlots.sort((a, b) => {
      if (a.service !== b.service) return a.service.localeCompare(b.service);
      return a.startTime.getTime() - b.startTime.getTime();
    });

    // 6. Quality Metrics Calculation (ragged rows count toward totals)
    const raggedCount = this.csvParser.raggedIssues.length;
    const totalRows = rawRows.length + raggedCount;
    const metrics = this.qualityMetricsCalculator.calculate(
      totalRows,
      normalizedRows.length,
      totalRows - normalizedRows.length,
      duplicateCount,
      allResolvedSlots,
      uniqueRows,
    );

    const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    metrics.processingTimeMs = elapsedMs;

    return {
      observations: uniqueRows,
      slots: allResolvedSlots,
      issues,
      metrics,
    };
  }
}
