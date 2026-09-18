import assert from "node:assert/strict";
import { test } from "node:test";
import type { Pool, PoolClient } from "pg";

import { FileHasher } from "../src/domain/FileHasher.js";
import { StrictCsvParser } from "../src/domain/StrictCsvParser.js";
import { FieldAliasResolver } from "../src/domain/FieldAliasResolver.js";
import { StatusClassifier } from "../src/domain/StatusClassifier.js";
import { RowNormalizer } from "../src/domain/RowNormalizer.js";
import { DuplicateRemover } from "../src/domain/DuplicateRemover.js";
import { AgentEvidenceResolver } from "../src/domain/AgentEvidenceResolver.js";
import { SlotResolver } from "../src/domain/SlotResolver.js";
import { MissingSlotGenerator } from "../src/domain/MissingSlotGenerator.js";
import { QualityMetricsCalculator } from "../src/domain/QualityMetricsCalculator.js";
import { SlaCsvProcessor } from "../src/domain/SlaCsvProcessor.js";
import { SlaDatasetImporter } from "../src/services/SlaDatasetImporter.js";
import { PostgresDatasetRepository } from "../src/repositories/postgresDatasetRepository.js";
import type { IDatasetRepository } from "../src/contracts/repository.interface.js";
import type { DatasetSummary, SaveImportResult } from "../src/contracts/repository.js";
import type { PreparedImport } from "../src/contracts/import.js";

function buildProcessor(): SlaCsvProcessor {
  const strictCsvParser = new StrictCsvParser();
  const fieldAliasResolver = new FieldAliasResolver();
  const statusClassifier = new StatusClassifier();
  const rowNormalizer = new RowNormalizer(statusClassifier, fieldAliasResolver);
  const duplicateRemover = new DuplicateRemover();
  const agentEvidenceResolver = new AgentEvidenceResolver();
  const slotResolver = new SlotResolver();
  const missingSlotGenerator = new MissingSlotGenerator();
  const qualityMetricsCalculator = new QualityMetricsCalculator();

  return new SlaCsvProcessor(
    strictCsvParser,
    rowNormalizer,
    duplicateRemover,
    agentEvidenceResolver,
    slotResolver,
    missingSlotGenerator,
    qualityMetricsCalculator,
  );
}

// 1. epoch seconds convert to milliseconds; quoted CSV fields parse correctly
test("1. epoch seconds convert to milliseconds; quoted CSV fields parse correctly", () => {
  const processor = buildProcessor();
  const csv = [
    '"agent","timestamp","latency","status"',
    '"agent1","1773738000","150","up"',
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  assert.equal(result.observations.length, 1);
  assert.equal(result.observations[0].agentId, "agent1");
  // 1773738000 s -> 1773738000000 ms
  assert.equal(result.observations[0].timestamp.getTime(), 1773738000 * 1000);
  assert.equal(result.observations[0].latencyMs, 150);
  assert.equal(result.observations[0].status, "UP");
});

// 2. an invalid status (e.g. "999") does not override a valid corroborating agent
test('2. an invalid status (e.g. "999") does not override a valid corroborating agent', () => {
  const processor = buildProcessor();
  const csv = [
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:00:00Z,100,999",
    "agent2,2026-09-17T10:00:00Z,120,200",
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  const slot = result.slots.find((s) => s.slotKey === "2026-09-17T10:00:00.000Z");
  assert.ok(slot, "Slot should exist");
  assert.equal(slot.status, "UP", "Slot status should be UP governed by agent2");

  const invalidStatusIssue = result.issues.find((i) => i.code === "INVALID_HTTP_STATUS");
  assert.ok(invalidStatusIssue, "INVALID_HTTP_STATUS issue should be logged");
});

// 3. conflicting agent evidence resolves by majority vote (UP wins exact ties)
test("3. conflicting agent evidence resolves by majority vote (UP wins exact ties)", () => {
  const processor = buildProcessor();
  // Exact 1v1 tie -> UP with conflicting_evidence (UP > DOWN tiebreak)
  const tied = processor.process(Buffer.from([
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:00:00Z,100,up",
    "agent2,2026-09-17T10:00:00Z,120,down",
  ].join("\n")));
  const tiedSlot = tied.slots.find((s) => s.slotKey === "2026-09-17T10:00:00.000Z");
  assert.ok(tiedSlot);
  assert.equal(tiedSlot.status, "UP");
  assert.equal(tiedSlot.reason, "conflicting_evidence");

  // 2v1 majority DOWN -> DOWN (conflict still flagged via reason)
  const majority = processor.process(Buffer.from([
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:00:00Z,100,up",
    "agent2,2026-09-17T10:00:00Z,120,down",
    "agent3,2026-09-17T10:00:00Z,130,down",
  ].join("\n")));
  const majoritySlot = majority.slots.find((s) => s.slotKey === "2026-09-17T10:00:00.000Z");
  assert.ok(majoritySlot);
  assert.equal(majoritySlot.status, "DOWN");
  assert.equal(majoritySlot.reason, "conflicting_evidence");
});

// 4. same-agent complementary latency variants (one blank, one present) merge deterministically, keeping the present value
test("4. same-agent complementary latency variants (one blank, one present) merge deterministically, keeping the present value", () => {
  const processor = buildProcessor();
  const csv = [
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:02:00Z,250,up",
    "agent1,2026-09-17T10:05:00Z,,up",
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  const slot = result.slots.find((s) => s.slotKey === "2026-09-17T10:00:00.000Z");
  assert.ok(slot);
  assert.equal(slot.status, "UP");
  assert.equal(slot.medianLatencyMs, 250);
});

// 5. same-agent different valid latencies are NOT averaged — result is NULL + flag
test("5. same-agent different valid latencies are NOT averaged — result is NULL + flag", () => {
  const processor = buildProcessor();
  const csv = [
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:02:00Z,200,up",
    "agent1,2026-09-17T10:05:00Z,300,up",
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  const slot = result.slots.find((s) => s.slotKey === "2026-09-17T10:00:00.000Z");
  assert.ok(slot);
  assert.equal(slot.status, "UP");
  assert.equal(slot.medianLatencyMs, null, "Latency should be null when conflicting");

  const latencyConflict = result.issues.find((i) => i.code === "CONFLICTING_LATENCY");
  assert.ok(latencyConflict, "CONFLICTING_LATENCY issue should be logged");
});

// 6. an exact normalized duplicate row does not inflate the observation count
test("6. an exact normalized duplicate row does not inflate the observation count", () => {
  const processor = buildProcessor();
  const csv = [
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:00:00Z,100,up",
    "agent1,2026-09-17T10:00:00Z,100,up",
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  assert.equal(result.observations.length, 1, "Only 1 observation should remain");
  assert.equal(result.metrics.duplicateRows, 1, "Duplicate count should be 1");
});

// 7. a missing 15-minute slot is generated explicitly as UNKNOWN/missing, never dropped
test("7. a missing 15-minute slot is generated explicitly as UNKNOWN/missing, never dropped", () => {
  const processor = buildProcessor();
  // Observations in slot 10:00 and 10:30 -> 10:15 is completely missing
  const csv = [
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:00:00Z,100,up",
    "agent1,2026-09-17T10:30:00Z,100,up",
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  assert.equal(result.slots.length, 3, "Expected 3 slots (10:00, 10:15, 10:30)");

  const missingSlot = result.slots.find((s) => s.slotKey === "2026-09-17T10:15:00.000Z");
  assert.ok(missingSlot, "Slot 10:15 should exist explicitly");
  assert.equal(missingSlot.status, "UNKNOWN");
  assert.equal(missingSlot.reason, "missing");
});

// 8. negative latency becomes NULL without discarding the row's availability evidence
test("8. negative latency becomes NULL without discarding the row's availability evidence", () => {
  const processor = buildProcessor();
  const csv = [
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:00:00Z,-50,up",
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  assert.equal(result.observations.length, 1);
  assert.equal(result.observations[0].latencyMs, null, "Latency should be normalized to null");
  assert.equal(result.observations[0].status, "UP", "Status UP must be preserved");

  const negIssue = result.issues.find((i) => i.code === "NEGATIVE_LATENCY");
  assert.ok(negIssue, "NEGATIVE_LATENCY issue should be recorded");

  const slot = result.slots[0];
  assert.equal(slot.status, "UP", "Slot should be resolved as UP using preserved status");
  assert.equal(slot.medianLatencyMs, null);
});

// 9. a timestamp with a timezone offset normalizes into the correct UTC slot
test("9. a timestamp with a timezone offset normalizes into the correct UTC slot", () => {
  const processor = buildProcessor();
  // 15:35:00 +05:30 is 10:05:00 UTC, which falls in the 10:00:00 UTC slot
  const csv = [
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T15:35:00+05:30,100,up",
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  assert.equal(result.slots.length, 1);
  assert.equal(
    result.slots[0].slotKey,
    "2026-09-17T10:00:00.000Z",
    "Should normalize into 10:00:00 UTC slot",
  );
  assert.equal(result.observations[0].timestamp.toISOString(), "2026-09-17T10:05:00.000Z");
});

// 10. a malformed/ragged CSV row is quarantined as an issue; valid rows still import
test("10. a malformed/ragged CSV row is quarantined as an issue; valid rows still import", () => {
  const processor = buildProcessor();
  // Line 3 has an extra column (ragged) -> skipped with a RAGGED_ROW issue
  const csv = [
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:00:00Z,100,up",
    "agent2,2026-09-17T10:00:00Z,100,up,extra_garbage_column",
  ].join("\n");

  const result = processor.process(Buffer.from(csv));
  assert.equal(result.observations.length, 1, "Valid row must still be processed");
  const ragged = result.issues.find((i) => i.code === "RAGGED_ROW");
  assert.ok(ragged, "RAGGED_ROW issue should be recorded for line 3");
  assert.equal(ragged.row, 3);
});

// 11. saveImport() only commits after every child batch insert succeeds
test("11. saveImport() only commits after every child batch insert succeeds", async () => {
  const executedQueries: string[] = [];
  let clientReleased = false;

  const mockClient = {
    query: async (queryText: string) => {
      executedQueries.push(queryText.trim());
      if (queryText.includes("INSERT INTO datasets")) {
        return { rows: [{ dataset_id: "mock-dataset-uuid" }] };
      }
      return { rows: [] };
    },
    release: () => {
      clientReleased = true;
    },
  } as unknown as PoolClient;

  const mockPool = {
    connect: async () => mockClient,
  } as unknown as Pool;

  const repo = new PostgresDatasetRepository(mockPool);
  const sampleImport: PreparedImport = {
    userId: "user-1",
    filename: "test.csv",
    fileHash: "hash123",
    policyVersion: "1.0.0",
    checklist: {
      format: "test",
      version: "1.0.0",
      startDate: new Date(),
      endDate: new Date(),
      agentCount: 1,
    },
    observations: [
      { agentId: "agent1", service: "api", timestamp: new Date(), latencyMs: 100, status: "up" },
    ],
    slots: [
      {
        slotKey: "2026-09-17T10:00:00.000Z",
        service: "api",
        startTime: new Date(),
        endTime: new Date(),
        durationSeconds: 900,
        uptimeSeconds: 900,
        downtimeSeconds: 0,
        unknownSeconds: 0,
        averageLatencyMs: 100,
      },
    ],
    issues: [
      { row: 1, field: "field", message: "issue message" },
    ],
  };

  const result = await repo.saveImport(sampleImport);
  assert.equal(result.datasetId, "mock-dataset-uuid");

  // Verify transaction ordering: BEGIN -> dataset -> observations -> slots -> issues -> COMMIT
  assert.equal(executedQueries[0], "BEGIN");
  assert.ok(executedQueries[1].includes("INSERT INTO datasets"));
  assert.ok(executedQueries[2].includes("INSERT INTO observations"));
  assert.ok(executedQueries[3].includes("INSERT INTO slots"));
  assert.ok(executedQueries[4].includes("INSERT INTO data_quality_issues"));
  assert.equal(executedQueries[5], "COMMIT");
  assert.equal(clientReleased, true, "Client must be released");
});

// 12. saveImport() rolls back AND releases the pool client on any child insert failure
test("12. saveImport() rolls back AND releases the pool client on any child insert failure", async () => {
  const executedQueries: string[] = [];
  let clientReleased = false;

  const mockClient = {
    query: async (queryText: string) => {
      executedQueries.push(queryText.trim());
      if (queryText.includes("INSERT INTO datasets")) {
        return { rows: [{ dataset_id: "mock-dataset-uuid" }] };
      }
      if (queryText.includes("INSERT INTO observations")) {
        throw new Error("DB Error: observation insert failed");
      }
      return { rows: [] };
    },
    release: () => {
      clientReleased = true;
    },
  } as unknown as PoolClient;

  const mockPool = {
    connect: async () => mockClient,
  } as unknown as Pool;

  const repo = new PostgresDatasetRepository(mockPool);
  const sampleImport: PreparedImport = {
    userId: "user-1",
    filename: "test.csv",
    fileHash: "hash123",
    policyVersion: "1.0.0",
    checklist: {
      format: "test",
      version: "1.0.0",
      startDate: new Date(),
      endDate: new Date(),
      agentCount: 1,
    },
    observations: [
      { agentId: "agent1", service: "api", timestamp: new Date(), latencyMs: 100, status: "up" },
    ],
    slots: [],
    issues: [],
  };

  await assert.rejects(
    () => repo.saveImport(sampleImport),
    /DB Error: observation insert failed/,
  );

  assert.equal(executedQueries[0], "BEGIN");
  assert.ok(executedQueries[executedQueries.length - 1].includes("ROLLBACK"));
  assert.ok(!executedQueries.includes("COMMIT"), "COMMIT must never be called on failure");
  assert.equal(clientReleased, true, "Pool client must be released in finally block");
});

// 13. re-importing identical bytes under the same policy_version returns reused:true and performs zero additional writes
test("13. re-importing identical bytes under the same policy_version returns reused:true and performs zero additional writes", async () => {
  const processor = buildProcessor();
  const fileHasher = new FileHasher();

  const store = new Map<string, DatasetSummary>();
  let saveImportCallCount = 0;

  const mockRepo: IDatasetRepository = {
    findByHash: async (hash: string, policy: string, userId: string) => {
      return store.get(`${hash}:${policy}:${userId}`) ?? null;
    },
    findByFingerprint: async (hash: string, policy: string, userId: string) => {
      return store.get(`${hash}:${policy}:${userId}`) ?? null;
    },
    listDatasets: async () => Array.from(store.values()),
    listDatasetsPaginated: async (_userId: string, _page: number, _pageSize: number) => ({
      datasets: Array.from(store.values()),
      total: store.size,
    }),
    findById: async (datasetId: string) => {
      return Array.from(store.values()).find((s) => s.datasetId === datasetId) ?? null;
    },
    saveImport: async (input: PreparedImport): Promise<SaveImportResult> => {
      saveImportCallCount++;
      const summary: DatasetSummary = {
        datasetId: "id-" + Math.random().toString(36).slice(2),
        filename: input.filename,
        fileHash: input.fileHash,
        policyVersion: input.policyVersion,
        startDate: input.checklist.startDate,
        endDate: input.checklist.endDate,
        agentCount: input.checklist.agentCount,
        observationCount: input.observations.length,
        slotCount: input.slots.length,
        issueCount: input.issues.length,
        uploadedAt: new Date(),
      };
      store.set(`${input.fileHash}:${input.policyVersion}:${input.userId}`, summary);
      return {
        datasetId: summary.datasetId,
        observationCount: summary.observationCount,
        slotCount: summary.slotCount,
        issueCount: summary.issueCount,
      };
    },
  };

  const importer = new SlaDatasetImporter(processor, mockRepo, fileHasher);
  const csvBytes = Buffer.from([
    "agent,timestamp,latency,status",
    "agent1,2026-09-17T10:00:00Z,100,up",
  ].join("\n"));

  // First import
  const firstResult = await importer.importDataset({
    bytes: csvBytes,
    filename: "sla.csv",
    policyVersion: "1.0.0",
    userId: "user-1",
  });

  assert.equal(firstResult.reused, false);
  assert.equal(saveImportCallCount, 1);
  const firstDatasetId = firstResult.datasetId;

  // Second import with identical bytes & same policy version
  const secondResult = await importer.importDataset({
    bytes: csvBytes,
    filename: "sla.csv",
    policyVersion: "1.0.0",
    userId: "user-1",
  });

  assert.equal(secondResult.reused, true);
  assert.equal(secondResult.datasetId, firstDatasetId);
  assert.equal(
    saveImportCallCount,
    1,
    "saveImport must NOT be called again on idempotent re-import",
  );
});
