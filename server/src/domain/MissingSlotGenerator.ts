import type { CanonicalSlot } from "./SlotResolver.js";
import { SLOT_DURATION_MS } from "./AgentEvidenceResolver.js";

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
