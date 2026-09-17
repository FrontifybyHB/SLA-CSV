import assert from "node:assert/strict";
import { test } from "node:test";

import {
  classifyStatus,
  normalizeAgentId,
  normalizeLatency,
  normalizeTimestamp,
  parseLatency,
} from "../src/domain/normalize.js";
import { CsvFormatError } from "../src/domain/normalize.js";

test("normalizeLatency converts seconds to milliseconds", () => {
  assert.equal(normalizeLatency("0.486", "s"), 486);
  assert.equal(normalizeLatency("1.000", "s"), 1000);
});

test("normalizeLatency keeps milliseconds as-is", () => {
  assert.equal(normalizeLatency("486", "ms"), 486);
  assert.equal(normalizeLatency("42", "ms"), 42);
});

test("normalizeLatency returns null for empty input", () => {
  assert.equal(normalizeLatency("", "ms"), null);
});

test("normalizeLatency rejects negatives and non-numbers", () => {
  assert.throws(() => normalizeLatency("-5", "ms"), CsvFormatError);
  assert.throws(() => normalizeLatency("abc", "ms"), CsvFormatError);
});

test("parseLatency handles explicit and bare values", () => {
  assert.equal(parseLatency("0.486s"), 486);
  assert.equal(parseLatency("486ms"), 486);
  assert.equal(parseLatency("486"), 486);
  assert.equal(parseLatency("0.52 s"), 520);
});

test("classifyStatus maps aliases", () => {
  assert.equal(classifyStatus("up"), "up");
  assert.equal(classifyStatus("PASS"), "up");
  assert.equal(classifyStatus("down"), "down");
  assert.equal(classifyStatus("ERROR"), "down");
  assert.equal(classifyStatus("unknown"), "unknown");
  assert.equal(classifyStatus(""), "unknown");
});

test("classifyStatus rejects unrecognized values", () => {
  assert.throws(() => classifyStatus("maybe"), CsvFormatError);
});

test("normalizeAgentId accepts agent1-3", () => {
  assert.equal(normalizeAgentId("agent1"), "agent1");
  assert.equal(normalizeAgentId("Agent 3"), "agent3");
  assert.equal(normalizeAgentId("server1"), "agent1");
});

test("normalizeAgentId rejects out-of-range and garbage", () => {
  assert.throws(() => normalizeAgentId("agent4"), CsvFormatError);
  assert.throws(() => normalizeAgentId("mail-server"), CsvFormatError);
});

test("normalizeTimestamp parses ISO strings", () => {
  const parsed = normalizeTimestamp("2026-09-17T10:00:00Z");
  assert.equal(parsed.toISOString(), "2026-09-17T10:00:00.000Z");
});

test("normalizeTimestamp rejects garbage", () => {
  assert.throws(() => normalizeTimestamp("not-a-date"), CsvFormatError);
});