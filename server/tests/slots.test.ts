import assert from "node:assert/strict";
import { test } from "node:test";

import type { ParsedObservation } from "../src/contracts/import.js";
import {
  buildExpectedSlots,
  deduplicateObservations,
  resolveAgentObservations,
  resolveCheckSlot,
} from "../src/domain/slots.js";
import { SLOT_DURATION_SECONDS } from "../src/domain/constants.js";

function obs(agentId: string, timestamp: string, status: "up" | "down" | "unknown"): ParsedObservation {
  return {
    agentId: agentId as ParsedObservation["agentId"],
    service: "api",
    timestamp: new Date(timestamp),
    latencyMs: 100,
    status,
  };
}

test("buildExpectedSlots spans min to max timestamp", () => {
  const slots = buildExpectedSlots([
    obs("agent1", "2026-09-17T10:00:10Z", "up"),
    obs("agent1", "2026-09-17T10:02:50Z", "up"),
  ]);
  assert.equal(slots.length, 3);
  assert.equal(slots[0].slotKey, "2026-09-17T10:00:00Z");
  assert.equal(slots[2].slotKey, "2026-09-17T10:02:00Z");
  assert.equal(slots[0].durationSeconds, SLOT_DURATION_SECONDS);
});

test("deduplicateObservations collapses same agent+minute", () => {
  const result = deduplicateObservations([
    obs("agent1", "2026-09-17T10:00:10Z", "up"),
    obs("agent1", "2026-09-17T10:00:40Z", "down"),
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, "down");
});

test("resolveAgentObservations groups agents within each minute", () => {
  const analyses = resolveAgentObservations([
    obs("agent1", "2026-09-17T10:00:10Z", "up"),
    obs("agent2", "2026-09-17T10:00:20Z", "up"),
    obs("agent3", "2026-09-17T10:01:05Z", "down"),
  ]);
  assert.equal(analyses.length, 2);

  const first = analyses[0];
  assert.equal(first.agents.length, 2);
  assert.equal(first.resolved, "up");
  assert.equal(first.uptimeSeconds, 40);
  assert.equal(first.unknownSeconds, 20);
});

test("resolveCheckSlot returns full slot record", () => {
  const observations = [
    obs("agent1", "2026-09-17T10:00:10Z", "up"),
    obs("agent2", "2026-09-17T10:00:20Z", "up"),
    obs("agent3", "2026-09-17T10:00:30Z", "up"),
  ];
  const slots = buildExpectedSlots(observations);
  const analyses = resolveAgentObservations(observations);

  const resolved = resolveCheckSlot("2026-09-17T10:00:00Z", analyses, slots);
  assert.ok(resolved);
  assert.equal(resolved.uptimeSeconds, 60);
  assert.equal(resolved.downtimeSeconds, 0);
  assert.equal(resolved.durationSeconds, 60);
  assert.equal(resolved.startTime.toISOString(), "2026-09-17T10:00:00.000Z");
});

test("slot with a down agent counts downtime", () => {
  const observations = [
    obs("agent1", "2026-09-17T10:00:10Z", "up"),
    obs("agent2", "2026-09-17T10:00:20Z", "down"),
    obs("agent3", "2026-09-17T10:00:30Z", "up"),
  ];
  const slots = buildExpectedSlots(observations);
  const analyses = resolveAgentObservations(observations);
  const resolved = resolveCheckSlot("2026-09-17T10:00:00Z", analyses, slots);

  assert.ok(resolved);
  assert.equal(resolved.uptimeSeconds, 40);
  assert.equal(resolved.downtimeSeconds, 20);
  assert.equal(resolved.unknownSeconds, 0);
});