import assert from "node:assert/strict";
import { test } from "node:test";

import { parseCsv } from "../src/domain/csv.js";
import { CsvFormatError } from "../src/domain/normalize.js";

function csv(rows: string[]): Buffer {
  return Buffer.from(["agent,phase,response,status", ...rows].join("\n"));
}

test("parseCsv maps columns and trims values", async () => {
  const result = await parseCsv(csv([
    "agent1,2026-09-17T10:00:00Z,486,up",
    "agent2,2026-09-17T10:01:00Z,0.5s,down",
  ]));
  assert.equal(result.observations.length, 2);
  assert.equal(result.observations[0].agentId, "agent1");
  assert.equal(result.observations[0].timestamp, "2026-09-17T10:00:00Z");
  assert.equal(result.observations[0].latency, "486");
  assert.equal(result.observations[0].status, "up");
  assert.equal(result.issues.length, 0);
});

test("parseCsv accepts header aliases", async () => {
  const result = await parseCsv(Buffer.from(
    "Agent,Time,Latency (ms),Status\nagent1,2026-09-17T10:00:00Z,120,up\n",
  ));
  assert.equal(result.observations.length, 1);
});

test("parseCsv flags rows with missing required fields", async () => {
  const result = await parseCsv(csv([
    "agent1,2026-09-17T10:00:00Z,486,up",
    "agent2,,486,up",
    "agent3,2026-09-17T10:01:00Z,0.5s,",
  ]));
  assert.equal(result.observations.length, 1);
  assert.equal(result.issues.length, 2);
  assert.ok(result.issues[0].message.includes("phase"));
  assert.ok(result.issues[1].message.includes("status"));
});

test("parseCsv throws on missing columns", async () => {
  await assert.rejects(
    () => parseCsv(Buffer.from("agent,phase,response\nagent1,2026-09-17T10:00:00Z,486\n")),
    CsvFormatError,
  );
});

test("parseCsv throws on empty file", async () => {
  await assert.rejects(() => parseCsv(Buffer.from("")), CsvFormatError);
});

test("parseCsv throws when no usable data rows", async () => {
  await assert.rejects(
    () => parseCsv(csv(["agent1,,,"])),
    CsvFormatError,
  );
});