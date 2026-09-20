import type { CanonicalSlot } from "./SlotResolver.js";
import { SLOT_DURATION_MS } from "./AgentEvidenceResolver.js";
import { ImportError } from "../errors/ImportError.js";

// Upper bound on the date span a single upload may cover. Without it, two
// rows dated decades apart force millions of 15-minute slots to be
// generated and inserted in one transaction from a <1 KB file (DoS).
const MAX_SPAN_DAYS = 366;

export class MissingSlotGenerator {
  constructor() {}

  generate(
    service: string,
    observedSlots: Map<string, CanonicalSlot>,
    minTime: Date,
    maxTime: Date,
  ): CanonicalSlot[] {
    if (!minTime || !maxTime || Number.isNaN(minTime.getTime()) || Number.isNaN(maxTime.getTime())) {
      return [];
    }

    const startMs = Math.floor(minTime.getTime() / SLOT_DURATION_MS) * SLOT_DURATION_MS;
    const endMs = Math.floor(maxTime.getTime() / SLOT_DURATION_MS) * SLOT_DURATION_MS;

    if (endMs - startMs > MAX_SPAN_DAYS * 24 * 60 * 60 * 1000) {
      throw new ImportError(
        "DATE_SPAN_TOO_LARGE",
        `CSV timestamps for service "${service}" span more than ${MAX_SPAN_DAYS} days. ` +
          `Split the file into smaller time windows and re-upload.`,
      );
    }

    const allSlots: CanonicalSlot[] = [];

    for (let t = startMs; t <= endMs; t += SLOT_DURATION_MS) {
      const slotStart = new Date(t);
      const slotKey = slotStart.toISOString();
      const existing = observedSlots.get(slotKey);

      if (existing) {
        allSlots.push(existing);
      } else {
        const slotEnd = new Date(t + SLOT_DURATION_MS);
        allSlots.push({
          service,
          slotKey,
          startTime: slotStart,
          endTime: slotEnd,
          durationSeconds: Math.round(SLOT_DURATION_MS / 1000),
          status: "UNKNOWN",
          reason: "missing",
          medianLatencyMs: null,
        });
      }
    }

    return allSlots;
  }
}
