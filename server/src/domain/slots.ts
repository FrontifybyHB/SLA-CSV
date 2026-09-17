import type {
  AgentId,
  AvailabilityStatus,
  ParsedObservation,
  PreparedSlot,
  ResolvedSlot,
  SlotAnalysis,
  SlotKey,
  SlotObservation,
} from "../contracts/import.js";
import { AGENT_IDS, SLOT_DURATION_SECONDS } from "./constants.js";

function toSlotKey(timestamp: Date): SlotKey {
  const ms = Math.floor(timestamp.getTime() / (SLOT_DURATION_SECONDS * 1000)) * SLOT_DURATION_SECONDS * 1000;
  return new Date(ms).toISOString().slice(0, 19) + "Z";
}

function slotStart(timestamp: Date): Date {
  const ms = Math.floor(timestamp.getTime() / (SLOT_DURATION_SECONDS * 1000)) * SLOT_DURATION_SECONDS * 1000;
  return new Date(ms);
}

export function buildExpectedSlots(observations: ParsedObservation[]): PreparedSlot[] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const obs of observations) {
    const t = obs.timestamp.getTime();
    if (t < min) min = t;
    if (t > max) max = t;
  }
  if (!Number.isFinite(min)) {
    return [];
  }

  const start = slotStart(new Date(min));
  const rawEnd = slotStart(new Date(max));
  const end = new Date(rawEnd.getTime() + SLOT_DURATION_SECONDS * 1000);

  const slots: PreparedSlot[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += SLOT_DURATION_SECONDS * 1000) {
    const slotTime = new Date(t);
    slots.push({
      slotKey: toSlotKey(slotTime),
      durationSeconds: SLOT_DURATION_SECONDS,
      startTime: slotTime,
      endTime: new Date(t + SLOT_DURATION_SECONDS * 1000),
    });
  }
  return slots;
}

export function deduplicateObservations(observations: ParsedObservation[]): ParsedObservation[] {
  const best = new Map<string, ParsedObservation>();
  for (const obs of observations) {
    const key = `${obs.agentId}|${toSlotKey(obs.timestamp)}`;
    const existing = best.get(key);
    if (!existing) {
      best.set(key, obs);
      continue;
    }
    best.set(key, mergeObservation(existing, obs));
  }
  return [...best.values()];
}

function mergeObservation(a: ParsedObservation, b: ParsedObservation): ParsedObservation {
  const status = pickStatus([a.status, b.status]);
  const latencies = [a.latencyMs, b.latencyMs].filter((v): v is number => v !== null);
  return {
    agentId: a.agentId,
    timestamp: a.timestamp < b.timestamp ? a.timestamp : b.timestamp,
    latencyMs: latencies.length > 0 ? avg(latencies) : null,
    status,
  };
}

function pickStatus(statuses: AvailabilityStatus[]): AvailabilityStatus {
  if (statuses.some((s) => s === "down")) return "down";
  if (statuses.some((s) => s === "up")) return "up";
  return "unknown";
}

function avg(values: number[]): number {
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function resolveAgentObservations(observations: ParsedObservation[]): SlotAnalysis[] {
  const bySlot = new Map<SlotKey, Map<AgentId, SlotObservation>>();

  for (const obs of observations) {
    const key = toSlotKey(obs.timestamp);
    let agents = bySlot.get(key);
    if (!agents) {
      agents = new Map<AgentId, SlotObservation>();
      bySlot.set(key, agents);
    }

    const existing = agents.get(obs.agentId);
    if (existing) {
      const status = pickStatus([existing.status ?? "unknown", obs.status]);
      const latencies = [existing.latencyMs, obs.latencyMs].filter((v): v is number => v !== null);
      agents.set(obs.agentId, {
        agentId: obs.agentId,
        timestamp: existing.timestamp < obs.timestamp.toISOString() ? existing.timestamp : obs.timestamp.toISOString(),
        latencyMs: latencies.length > 0 ? avg(latencies) : null,
        status,
      });
    } else {
      agents.set(obs.agentId, {
        agentId: obs.agentId,
        timestamp: obs.timestamp.toISOString(),
        latencyMs: obs.latencyMs,
        status: obs.status,
      });
    }
  }

  const analyses: SlotAnalysis[] = [];
  for (const [slotKey, agents] of bySlot) {
    const agentList = [...agents.values()];
    const durations = buildSlotDurations(agentList);
    analyses.push({
      slotKey,
      agents: [...agents.entries()].map(([agentId, obs]) => ({
        agentId,
        observations: [obs],
      })),
      resolved: resolveSlotStatus(agentList),
      uptimeSeconds: durations.uptime,
      downtimeSeconds: durations.downtime,
      unknownSeconds: durations.unknown,
      averageLatencyMs: avgLatency(agentList),
    });
  }

  analyses.sort((a, b) => (a.slotKey < b.slotKey ? -1 : a.slotKey > b.slotKey ? 1 : 0));
  return analyses;
}

function buildSlotDurations(agents: SlotObservation[]): {
  uptime: number;
  downtime: number;
  unknown: number;
} {
  const portion = SLOT_DURATION_SECONDS / AGENT_IDS.length;
  let uptime = 0;
  let downtime = 0;
  let unknown = 0;

  for (const agent of agents) {
    if (agent.status === "up") {
      uptime += portion;
    } else if (agent.status === "down") {
      downtime += portion;
    } else {
      unknown += portion;
    }
  }

  const missing = AGENT_IDS.length - agents.length;
  unknown += missing * portion;

  return {
    uptime: round(uptime),
    downtime: round(downtime),
    unknown: round(unknown),
  };
}

function resolveSlotStatus(agents: SlotObservation[]): "up" | "down" | "unknown" | "mixed" {
  const statuses = new Set(agents.map((a) => a.status));
  if (statuses.size === 0 || (statuses.size === 1 && statuses.has("unknown"))) {
    return "unknown";
  }
  if (statuses.size === 1) {
    return [...statuses][0] as "up" | "down";
  }
  return "mixed";
}

function avgLatency(agents: SlotObservation[]): number | null {
  const latencies = agents.map((a) => a.latencyMs).filter((v): v is number => v !== null);
  return latencies.length > 0 ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length) : null;
}

export function resolveCheckSlot(
  slotKey: SlotKey,
  analyses: SlotAnalysis[],
  slots: PreparedSlot[],
): ResolvedSlot | null {
  const analysis = analyses.find((a) => a.slotKey === slotKey);
  const prepared = slots.find((s) => s.slotKey === slotKey);
  if (!analysis || !prepared) {
    return null;
  }
  return {
    slotKey: analysis.slotKey,
    startTime: prepared.startTime,
    endTime: prepared.endTime,
    durationSeconds: prepared.durationSeconds,
    uptimeSeconds: analysis.uptimeSeconds,
    downtimeSeconds: analysis.downtimeSeconds,
    unknownSeconds: analysis.unknownSeconds,
    averageLatencyMs: analysis.averageLatencyMs,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}