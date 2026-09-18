import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getApiConnectSrcOrigins,
  getPublicApiBase,
  getPublicRuntimeConfig,
  normalizeApiBase,
} from "../src/config/publicConfig.js";

describe("publicConfig", () => {
  it("normalizes trailing slashes and empty values", () => {
    assert.equal(normalizeApiBase("/api/v1/"), "/api/v1");
    assert.equal(normalizeApiBase(""), "/api/v1");
  });

  it("exposes runtime config for the browser", () => {
    const config = getPublicRuntimeConfig();
    assert.equal(typeof config.apiBase, "string");
    assert.ok(config.apiBase.length > 0);
  });

  it("returns connect-src origins only for absolute API bases", () => {
    const base = getPublicApiBase();
    const origins = getApiConnectSrcOrigins();
    if (/^https?:\/\//i.test(base)) {
      assert.equal(origins.length, 1);
      assert.equal(origins[0], new URL(base).origin);
    } else {
      assert.deepEqual(origins, []);
    }
  });
});
