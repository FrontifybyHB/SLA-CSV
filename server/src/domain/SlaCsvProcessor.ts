import { StrictCsvParser } from "./StrictCsvParser.js";
import { NormalizedRow, RowIssue, RowNormalizer } from "./RowNormalizer.js";
import { DuplicateRemover } from "./DuplicateRemover.js";
import { AgentEvidenceResolver, AgentSlotEvidence, SLOT_DURATION_MS } from "./AgentEvidenceResolver.js";
import { CanonicalSlot, SlotResolver } from "./SlotResolver.js";
import { MissingSlotGenerator } from "./MissingSlotGenerator.js";
import { QualityMetrics, QualityMetricsCalculator } from "./QualityMetricsCalculator.js";

export interface SlaProcessingResult {
  observations: NormalizedRow[];
  slots: CanonicalSlot[];
  issues: RowIssue[];
  metrics: QualityMetrics;
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
    // 1. Strict Parse (fails whole file if ragged/malformed)
    const rawRows = this.csvParser.parseRows(bytes);

    // 2. Row Normalization
    const normalizedRows: NormalizedRow[] = [];
    const issues: RowIssue[] = [];

    for (const raw of rawRows) {
      const res = this.rowNormalizer.normalize(raw);
      issues.push(...res.issues);
      if (res.row) {
        normalizedRows.push(res.row);
      }
    }

    // 3. Duplicate Removal
    const { uniqueRows, duplicateCount } = this.duplicateRemover.removeDuplicates(normalizedRows);

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

    // 6. Quality Metrics Calculation
    const metrics = this.qualityMetricsCalculator.calculate(
      rawRows.length,
      normalizedRows.length,
      rawRows.length - normalizedRows.length,
      duplicateCount,
      allResolvedSlots,
      uniqueRows,
    );

    return {
      observations: uniqueRows,
      slots: allResolvedSlots,
      issues,
      metrics,
    };
  }
}
