import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, test } from "node:test";
import type { Request, Response } from "express";

import pool, { checkDatabaseReady } from "../src/db/pool.js";
import { PostgresDatasetRepository } from "../src/repositories/postgresDatasetRepository.js";
import { PostgresUserRepository } from "../src/repositories/postgresUserRepository.js";
import { ImportService } from "../src/services/importService.js";
import { DatasetController } from "../src/controllers/datasetController.js";
import { SlaDatasetImporter } from "../src/services/SlaDatasetImporter.js";
import { FileHasher } from "../src/domain/FileHasher.js";
import { SlaCsvProcessor } from "../src/domain/SlaCsvProcessor.js";
import { StrictCsvParser } from "../src/domain/StrictCsvParser.js";
import { FieldAliasResolver } from "../src/domain/FieldAliasResolver.js";
import { StatusClassifier } from "../src/domain/StatusClassifier.js";
import { RowNormalizer } from "../src/domain/RowNormalizer.js";
import { DuplicateRemover } from "../src/domain/DuplicateRemover.js";
import { AgentEvidenceResolver } from "../src/domain/AgentEvidenceResolver.js";
import { SlotResolver } from "../src/domain/SlotResolver.js";
import { MissingSlotGenerator } from "../src/domain/MissingSlotGenerator.js";
import { QualityMetricsCalculator } from "../src/domain/QualityMetricsCalculator.js";
import type { UserRecord } from "../src/contracts/auth.js";
import type { PreparedImport } from "../src/contracts/import.js";

const POLICY_VERSION = "1.0.0";

let dbReady = false;

before(async () => {
  try {
    await checkDatabaseReady();
    dbReady = true;
  } catch {
    dbReady = false;
  }
});

async function createUser(emailSuffix: string): Promise<UserRecord> {
  const repo = new PostgresUserRepository(pool);
  return repo.create({
    email: `isolation-${emailSuffix}-${randomUUID().slice(0, 8)}@example.com`,
    passwordHash: "test-hash-not-a-real-bcrypt",
  });
}

async function cleanupUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) {
    return;
  }
  await pool.query(
    "DELETE FROM datasets WHERE user_id = ANY($1::uuid[])",
    [userIds],
  );
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [userIds]);
}

function preparedImport(userId: string, fileHash: string, filename: string): PreparedImport {
  return {
    userId,
    filename,
    fileHash,
    policyVersion: POLICY_VERSION,
    checklist: {
      format: "sla-checklist",
      version: POLICY_VERSION,
      startDate: new Date("2026-09-17T10:00:00.000Z"),
      endDate: new Date("2026-09-17T10:15:00.000Z"),
      agentCount: 1,
    },
    observations: [
      {
        agentId: "agent1",
        service: "api",
        timestamp: new Date("2026-09-17T10:00:00.000Z"),
        latencyMs: 100,
        status: "up",
      },
    ],
    slots: [
      {
        slotKey: "2026-09-17T10:00:00.000Z",
        service: "api",
        startTime: new Date("2026-09-17T10:00:00.000Z"),
        endTime: new Date("2026-09-17T10:15:00.000Z"),
        durationSeconds: 900,
        uptimeSeconds: 900,
        downtimeSeconds: 0,
        unknownSeconds: 0,
        averageLatencyMs: 100,
      },
    ],
    issues: [],
  };
}

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

// Test 7: a User B query can never return a dataset owned by User A, even when User B
// supplies User A's real dataset id (enforced by the SQL, not an app-level if).
test("7. User B can never retrieve User A's dataset through the repository", async (t) => {
  if (!dbReady) {
    t.skip("Postgres is unavailable; skipping live-DB isolation test");
    return;
  }

  const userA = await createUser("a");
  const userB = await createUser("b");
  const repo = new PostgresDatasetRepository(pool);

  try {
    const saved = await repo.saveImport(
      preparedImport(userA.id, "hash-owner-a", "a.csv"),
    );

    const asB = await repo.findByHash("hash-owner-a", POLICY_VERSION, userB.id);
    const asA = await repo.findByHash("hash-owner-a", POLICY_VERSION, userA.id);

    assert.equal(asB, null, "User B must not see User A's dataset via findByHash");
    assert.ok(asA, "User A must see their own dataset");
    assert.equal(asA!.datasetId, saved.datasetId);
  } finally {
    await cleanupUsers([userA.id, userB.id]);
  }
});

// Test 8: the dataset LIST endpoint, called as User A, never includes User B's dataset.
test("8. dataset list endpoint as User A never includes User B's dataset", async (t) => {
  if (!dbReady) {
    t.skip("Postgres is unavailable; skipping live-DB isolation test");
    return;
  }

  const userA = await createUser("a");
  const userB = await createUser("b");
  const repo = new PostgresDatasetRepository(pool);

  try {
    const savedA = await repo.saveImport(
      preparedImport(userA.id, "hash-list-a", "a.csv"),
    );
    const savedB = await repo.saveImport(
      preparedImport(userB.id, "hash-list-b", "b.csv"),
    );
    assert.notEqual(savedA.datasetId, savedB.datasetId);

    // Direct repository list is scoped at the query layer.
    const listA = await repo.listDatasets(userA.id);
    const listB = await repo.listDatasets(userB.id);

    assert.equal(listA.length, 1);
    assert.equal(listA[0].datasetId, savedA.datasetId);
    assert.equal(listB.length, 1);
    assert.equal(listB[0].datasetId, savedB.datasetId);

    // Exercise the full endpoint chain: controller -> service -> repository -> SQL.
    const service = new ImportService(repo, {
      format: "sla-checklist",
      version: POLICY_VERSION,
      policyVersion: POLICY_VERSION,
    });
    const controller = new DatasetController(service);

    const body = await new Promise<{ data: { datasetId: string }[] }>((resolve, reject) => {
      const req = { user: { id: userA.id, role: "user" } } as unknown as Request;
      const res = {
        status: () => res,
        json: (payload: unknown) => resolve(payload as { data: { datasetId: string }[] }),
      } as unknown as Response;
      controller.list(req, res, (err?: unknown) => {
        if (err) {
          reject(err as Error);
        }
      });
    });

    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].datasetId, savedA.datasetId);
  } finally {
    await cleanupUsers([userA.id, userB.id]);
  }
});

// Test 9: byte-identical CSVs uploaded by two different users produce two datasets
// (validates the corrected 3-column idempotency key).
test("9. byte-identical CSVs as two users produce two separate datasets", async (t) => {
  if (!dbReady) {
    t.skip("Postgres is unavailable; skipping live-DB isolation test");
    return;
  }

  const userA = await createUser("a");
  const userB = await createUser("b");
  const repo = new PostgresDatasetRepository(pool);

  try {
    const importer = new SlaDatasetImporter(
      buildProcessor(),
      repo,
      new FileHasher(),
    );

    const csvBytes = Buffer.from([
      "agent,timestamp,latency,status",
      "agent1,2026-09-17T10:00:00Z,100,up",
    ].join("\n"));

    const resA = await importer.importDataset({
      bytes: csvBytes,
      filename: "identical.csv",
      policyVersion: POLICY_VERSION,
      userId: userA.id,
    });
    const resB = await importer.importDataset({
      bytes: csvBytes,
      filename: "identical.csv",
      policyVersion: POLICY_VERSION,
      userId: userB.id,
    });

    assert.equal(resA.reused, false);
    assert.equal(resB.reused, false);
    assert.notEqual(
      resA.datasetId,
      resB.datasetId,
      "Same bytes from different users must yield different datasets",
    );

    const listA = await repo.listDatasets(userA.id);
    const listB = await repo.listDatasets(userB.id);
    assert.equal(listA.length, 1);
    assert.equal(listB.length, 1);
    assert.equal(listA[0].datasetId, resA.datasetId);
    assert.equal(listB[0].datasetId, resB.datasetId);
  } finally {
    await cleanupUsers([userA.id, userB.id]);
  }
});