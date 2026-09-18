import type { AgentSlotEvidence } from "./AgentEvidenceResolver.js";

export type ResolvedSlotStatus = "UP" | "DOWN" | "UNKNOWN";

export interface CanonicalSlot {
  service: string;
  slotKey: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  status: ResolvedSlotStatus;
  reason?: string; // "conflicting_evidence" | "no_valid_evidence" | "missing"
  medianLatencyMs: number | null;
}

export class SlotResolver {
  constructor() {}

  resolveSlot(
    service: string,
    slotStart: Date,
    slotEnd: Date,
    evidences: AgentSlotEvidence[],
  ): CanonicalSlot {
    const slotKey = slotStart.toISOString();
    const durationSeconds = Math.round((slotEnd.getTime() - slotStart.getTime()) / 1000);

    // If no evidence at all
    if (!evidences || evidences.length === 0) {
      return {
        service,
        slotKey,
        startTime: slotStart,
        endTime: slotEnd,
        durationSeconds,
        status: "UNKNOWN",
        reason: "no_valid_evidence",
        medianLatencyMs: null,
      };
    }

    // Only agents with UP or DOWN evidence get a vote
    const votingEvidences = evidences.filter((e) => e.status === "UP" || e.status === "DOWN");

    // Calculate median latency across valid non-null latencies
    const latencies = evidences
      .map((e) => e.latencyMs)
      .filter((l): l is number => l !== null);
    const medianLatencyMs = this.calculateMedian(latencies);

    if (votingEvidences.length === 0) {
      // No valid UP/DOWN evidence (all were UNKNOWN_EVIDENCE)
      return {
        service,
        slotKey,
        startTime: slotStart,
        endTime: slotEnd,
        durationSeconds,
        status: "UNKNOWN",
        reason: "no_valid_evidence",
        medianLatencyMs,
      };
    }

    const upVotes = votingEvidences.filter((e) => e.status === "UP").length;
    const downVotes = votingEvidences.filter((e) => e.status === "DOWN").length;
    const contested = upVotes > 0 && downVotes > 0;

    // Majority vote with UP > DOWN tiebreak (per product spec).
    if (upVotes >= downVotes && upVotes > 0) {
      if (upVotes === downVotes) {
        // Exact tie resolves UP but stays visible as conflicting evidence.
        return {
          service,
          slotKey,
          startTime: slotStart,
          endTime: slotEnd,
          durationSeconds,
          status: "UP",
          reason: "conflicting_evidence",
          medianLatencyMs,
        };
      }
      return {
        service,
        slotKey,
        startTime: slotStart,
        endTime: slotEnd,
        durationSeconds,
        status: "UP",
        ...(contested ? { reason: "conflicting_evidence" } : {}),
        medianLatencyMs,
      };
    }

    return {
      service,
      slotKey,
      startTime: slotStart,
      endTime: slotEnd,
      durationSeconds,
      status: "DOWN",
      ...(contested ? { reason: "conflicting_evidence" } : {}),
      medianLatencyMs,
    };
  }

  private calculateMedian(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
      return sorted[mid];
    }
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
