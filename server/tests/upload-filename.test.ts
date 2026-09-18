import assert from "node:assert/strict";
import { test } from "node:test";

import { sanitizeFilename } from "../src/middlewares/fileUpload.js";
import { uploadRequestSchema } from "../src/validators/request.validator.js";

function accepts(filename: string): boolean {
  const sanitized = sanitizeFilename(filename);
  const { error } = uploadRequestSchema.validate(
    { filename: sanitized, contentType: "text/csv", size: 100 },
    { abortEarly: false },
  );
  return !error;
}

test("sanitizeFilename keeps everyday names usable", () => {
  assert.equal(sanitizeFilename("simple.csv"), "simple.csv");
  assert.equal(sanitizeFilename("my report.csv"), "my report.csv");
  assert.equal(sanitizeFilename("my report (1).csv"), "my report _1_.csv");
  assert.equal(sanitizeFilename("SLA-Report_Aug.2026.csv"), "SLA-Report_Aug.2026.csv");
});

test("sanitizeFilename strips directories and blanks", () => {
  assert.equal(sanitizeFilename("C:\\fakepath\\data.csv"), "data.csv");
  assert.equal(sanitizeFilename("../../etc/data.csv"), "data.csv");
  assert.equal(sanitizeFilename(undefined), undefined);
  assert.equal(sanitizeFilename("   "), undefined);
});

test("everyday browser filenames pass upload validation after sanitizing", () => {
  assert.ok(accepts("simple.csv"));
  assert.ok(accepts("my report.csv"));
  assert.ok(accepts("my report (1).csv"));
  assert.ok(accepts("SLA Report (Aug).csv"));
});

test("non-CSV names are still rejected", () => {
  assert.ok(!accepts("notes.txt"));
  assert.ok(!accepts("data.csv.exe"));
});
