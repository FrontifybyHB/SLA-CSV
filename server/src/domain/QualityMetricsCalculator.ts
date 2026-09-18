import type { CanonicalSlot } from "./SlotResolver.js";
import type { NormalizedRow } from "./RowNormalizer.js";

export interface ServiceQualityMetrics {
  service: string;
  expectedSlots: number;
  observedSlots: number;
  missingSlots: number;
  upSlots: number;
  downSlots: number;
  unknownSlots: number;
  uptimePercentage: number;
  medianLatencyMs: number | null;
  p95LatencyMs: number | null;
}

export interface QualityMetrics {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  expectedSlotsTotal: number;
  observedSlotsTotal: number;
  missingSlotsTotal: number;
  services: Record<string, ServiceQualityMetrics>;
  processingTimeMs?: number;
}

export class QualityMetricsCalculator {
  constructor() {}

  calculate(
    totalRows: number,
    validRows: number,
    invalidRows: number,
    duplicateRows: number,
    allSlots: CanonicalSlot[],
    allObservations: NormalizedRow[],
  ): QualityMetrics {
    const slotsByService = new Map<string, CanonicalSlot[]>();
    for (const slot of allSlots) {
      let list = slotsByService.get(slot.service);
      if (!list) {
        list = [];
        slotsByService.set(slot.service, list);
      }
      list.push(slot);
    }

    const obsByService = new Map<string, NormalizedRow[]>();
    for (const obs of allObservations) {
      let list = obsByService.get(obs.service);
      if (!list) {
        list = [];
        obsByService.set(obs.service, list);
      }
      list.push(obs);
    }

    const services: Record<string, ServiceQualityMetrics> = {};
    let expectedSlotsTotal = 0;
    let observedSlotsTotal = 0;
    let missingSlotsTotal = 0;

    for (const [service, slots] of slotsByService.entries()) {
      const expected = slots.length;
      let observed = 0;
      let missing = 0;
      let up = 0;
      let down = 0;
      let unknown = 0;

      for (const slot of slots) {
        if (slot.reason === "missing") {
          missing++;
        } else {
          observed++;
        }

        if (slot.status === "UP") up++;
        else if (slot.status === "DOWN") down++;
        else unknown++;
      }

      expectedSlotsTotal += expected;
      observedSlotsTotal += observed;
      missingSlotsTotal += missing;

      const uptimePercentage =
        expected > 0 ? Math.round((up / expected) * 10000) / 100 : 0;

      // Latencies for service
      const serviceObs = obsByService.get(service) ?? [];
      const latencies = serviceObs
        .map((o) => o.latencyMs)
        .filter((l): l is number => l !== null)
        .sort((a, b) => a - b);

      const medianLatencyMs = this.calculatePercentile(latencies, 50);
      const p95LatencyMs = this.calculatePercentile(latencies, 95);

      services[service] = {
        service,
        expectedSlots: expected,
        observedSlots: observed,
        missingSlots: missing,
        upSlots: up,
        downSlots: down,
        unknownSlots: unknown,
        uptimePercentage,
        medianLatencyMs,
        p95LatencyMs,
      };
    }

    return {
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      expectedSlotsTotal,
      observedSlotsTotal,
      missingSlotsTotal,
      services,
    };
  }

  private calculatePercentile(sorted: number[], percentile: number): number | null {
    if (sorted.length === 0) return null;
    const index = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1),
    );
    return sorted[index];
  }
}
