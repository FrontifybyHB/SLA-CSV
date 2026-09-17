import type { CanonicalStatus } from "./StatusClassifier.js";
import type { NormalizedRow, RowIssue } from "./RowNormalizer.js";

export const SLOT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface AgentSlotEvidence {
  service: string;
  agentId: string;
  slotKey: string;
  slotStart: Date;
  status: CanonicalStatus;
  latencyMs: number | null;
  observedRowCount: number;
}

export interface AgentEvidenceResolutionResult {
  evidences: AgentSlotEvidence[];
  issues: RowIssue[];
}

export class AgentEvidenceResolver {
  constructor() {}

  resolve(rows: NormalizedRow[]): AgentEvidenceResolutionResult {
    const issues: RowIssue[] = [];
    const grouped = new Map<string, NormalizedRow[]>();

    for (const row of rows) {
      const slotStartMs = Math.floor(row.timestamp.getTime() / SLOT_DURATION_MS) * SLOT_DURATION_MS;
      const slotKey = new Date(slotStartMs).toISOString();
      const groupKey = `${row.service}|${row.agentId}|${slotKey}`;

      let list = grouped.get(groupKey);
      if (!list) {
        list = [];
        grouped.set(groupKey, list);
      }
      list.push(row);
    }

    const evidences: AgentSlotEvidence[] = [];

    for (const [groupKey, groupRows] of grouped.entries()) {
      const [service, agentId, slotKey] = groupKey.split("|");
      const slotStart = new Date(slotKey);

      if (groupRows.length === 1) {
        const single = groupRows[0];
        evidences.push({
          service,
          agentId,
          slotKey,
          slotStart,
          status: single.status,
          latencyMs: single.latencyMs,
          observedRowCount: 1,
        });
        continue;
      }

      // Multiple rows from same agent in same 15-minute slot
      const statuses = groupRows.map((r) => r.status);
      const hasUp = statuses.includes("UP");
      const hasDown = statuses.includes("DOWN");

      let resolvedStatus: CanonicalStatus;
      let resolvedLatency: number | null = null;

      if (hasUp && hasDown) {
        // Conflicting status from same agent in same slot
        resolvedStatus = "UNKNOWN_EVIDENCE";
        issues.push({
          row: groupRows[0].line,
          field: "status",
          code: "AGENT_SELF_CONFLICT",
          message: `Agent ${agentId} emitted conflicting statuses (UP and DOWN) in slot ${slotKey}`,
        });
      } else if (hasUp) {
        resolvedStatus = "UP";
      } else if (hasDown) {
        resolvedStatus = "DOWN";
      } else {
        resolvedStatus = "UNKNOWN_EVIDENCE";
      }

      // Latency resolution
      const distinctLatencies = Array.from(
        new Set(groupRows.map((r) => r.latencyMs).filter((l): l is number => l !== null)),
      );

      if (distinctLatencies.length === 0) {
        resolvedLatency = null;
      } else if (distinctLatencies.length === 1) {
        // One value present (or all identical) -> keep it
        resolvedLatency = distinctLatencies[0];
      } else {
        // Different valid latencies -> NULL + flag CONFLICTING_LATENCY (never average)
        resolvedLatency = null;
        issues.push({
          row: groupRows[0].line,
          field: "latency",
          code: "CONFLICTING_LATENCY",
          message: `Agent ${agentId} reported conflicting latencies (${distinctLatencies.join(", ")} ms) in slot ${slotKey}`,
        });
      }

      evidences.push({
        service,
        agentId,
        slotKey,
        slotStart,
        status: resolvedStatus,
        latencyMs: resolvedLatency,
        observedRowCount: groupRows.length,
      });
    }

    return { evidences, issues };
  }
}
